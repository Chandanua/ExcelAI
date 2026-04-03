import path from "path";
import { logger } from "../utils/logger";
import { generateEmailWithAI } from "./aiEmailGenerator";
import { sendEmail, EmailConfig, SmtpConfig } from "./emailSender";
import { createTrackingRecord, generateTrackingPixelUrl } from "./trackingService";
import { getAllRows, updateRowStatus } from "./excelWatcher";

interface EmailBuildResult {
  subject: string;
  html: string;
  text: string;
}

function getBaseUrl(): string {
  const fromEnv = process.env.APP_BASE_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const port = process.env.PORT || "8080";
  return `http://localhost:${port}`;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portRaw || !user || !pass) {
    logger.warn("SMTP configuration is incomplete. Skipping email send.", {
      hostSet: Boolean(host),
      portSet: Boolean(portRaw),
      userSet: Boolean(user),
      passSet: Boolean(pass),
    });
    return null;
  }

  const port = Number(portRaw) || 587;
  const secureEnv = process.env.SMTP_SECURE;
  const secure = secureEnv === "true" || secureEnv === "1" || port === 465;

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}

function getStringField(
  row: any,
  possibleNames: string[],
  fallback: string,
  detectEmailLike: boolean = false
): string {
  if (!row || typeof row !== "object") {
    return fallback;
  }

  for (const key of possibleNames) {
    const value = (row as any)[key];
    if (value !== undefined && value !== null) {
      const trimmed = String(value).trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  const normalizedTargets = possibleNames.map((name) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedTargets.includes(normalizedKey) && value !== undefined && value !== null) {
      const trimmed = String(value).trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  if (detectEmailLike) {
    for (const value of Object.values(row)) {
      if (value !== undefined && value !== null) {
        const trimmed = String(value).trim();
        if (trimmed.includes("@")) {
          return trimmed;
        }
      }
    }
  }

  return fallback;
}

async function buildEmailForRow(row: any, trackingPixelUrl: string): Promise<EmailBuildResult> {
  const email = getStringField(
    row,
    ["email", "Email", "EMAIL", "email address", "Email Address"],
    "",
    true
  );
  const name = getStringField(row, ["name", "Name", "full name", "Full Name"], "there");
  const company = getStringField(
    row,
    ["company", "Company", "company name", "Company Name"],
    "your company"
  );

  const subjectTemplate = process.env.EMAIL_SUBJECT_TEMPLATE || "Quick note for {{name}}";
  const bodyTemplate =
    process.env.EMAIL_BODY_TEMPLATE ||
    "Hi {{name}},\n\nThis is an automated follow-up from ExcelAI. We are reaching out regarding your interest related to {{company}}.\n\nBest regards,\nExcelAI";

  const variables: Record<string, string> = {
    name,
    company,
    email,
  };

  const aiProvider = process.env.AI_PROVIDER;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (aiProvider === "openai" && openAiKey) {
    try {
      const combinedTemplate = `${subjectTemplate}\n\n${bodyTemplate}`;
      const generated = await generateEmailWithAI({
        model: "openai",
        apiKey: openAiKey,
        template: combinedTemplate,
        variables,
      });

      const htmlWithPixel = `${generated.html}<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

      return {
        subject: generated.subject,
        html: htmlWithPixel,
        text: generated.body,
      };
    } catch (error) {
      logger.error("AI email generation failed. Falling back to template.", error);
    }
  }

  const subject = applyTemplate(subjectTemplate, variables);
  const textBody = applyTemplate(bodyTemplate, variables);
  const htmlBody = textBody
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
  const html = `${htmlBody}<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

  return {
    subject,
    html,
    text: textBody,
  };
}

export async function processRowAndSendEmail(row: any, rowIndex: number, excelPath: string): Promise<void> {
  try {
    const email = getStringField(
      row,
      ["email", "Email", "EMAIL", "email address", "Email Address"],
      "",
      true
    );
    if (!email) {
      logger.warn("Row has no email. Skipping.", { rowIndex });
      return;
    }

    if (row?.sent) {
      logger.debug("Row already marked as sent. Skipping.", { rowIndex, email });
      return;
    }

    const smtpConfig = getSmtpConfig();
    if (!smtpConfig) {
      return;
    }

    const baseUrl = getBaseUrl();
    const trackingId = createTrackingRecord(email, "pending", excelPath, rowIndex);
    const trackingPixelUrl = generateTrackingPixelUrl(trackingId, baseUrl);

    const emailContent = await buildEmailForRow(row, trackingPixelUrl);

    const from = process.env.EMAIL_FROM || smtpConfig.auth.user;
    const fromName = process.env.EMAIL_FROM_NAME;
    const replyTo = process.env.EMAIL_REPLY_TO || from;

    const emailConfig: EmailConfig = {
      provider: "smtp",
      from,
      fromName,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo,
      headers: {
        "X-Tracking-Id": trackingId,
      },
    };

    const result = await sendEmail(emailConfig, smtpConfig);

    if (!result.success) {
      logger.error("Failed to send email.", { email, error: result.error });
      return;
    }

    await updateRowStatus(excelPath, rowIndex, {
      sent: true,
      sentAt: result.timestamp,
    });

    logger.info("Email sent and Excel row updated.", { email, rowIndex });
  } catch (error) {
    logger.error("Error processing row and sending email.", { error: String(error), rowIndex });
  }
}

export async function processAllRows(excelPath: string): Promise<void> {
  try {
    const resolvedPath = path.resolve(excelPath);
    const rows = await getAllRows(resolvedPath);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      await processRowAndSendEmail(row, index, resolvedPath);
    }
  } catch (error) {
    logger.error("Error processing all rows in Excel file.", { error: String(error), excelPath });
  }
}

export async function sendManualBroadcast(
  excelPath: string,
  subjectTemplate: string,
  bodyTemplate: string
): Promise<{ totalLeads: number; sentCount: number; failedCount: number }> {
  try {
    const resolvedPath = path.resolve(excelPath);
    const rows = await getAllRows(resolvedPath);

    const smtpConfig = getSmtpConfig();
    if (!smtpConfig) {
      logger.warn("SMTP not configured. Cannot send manual broadcast.");
      return { totalLeads: rows.length, sentCount: 0, failedCount: rows.length };
    }

    const baseUrl = getBaseUrl();

    let sentCount = 0;
    let failedCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const email = getStringField(
        row,
        ["email", "Email", "EMAIL", "email address", "Email Address"],
        "",
        true
      );

      if (!email) {
        failedCount++;
        continue;
      }

      const name = getStringField(row, ["name", "Name", "full name", "Full Name"], "there");
      const company = getStringField(
        row,
        ["company", "Company", "company name", "Company Name"],
        "your company"
      );

      const variables: Record<string, string> = {
        name,
        company,
        email,
      };

      const trackingId = createTrackingRecord(email, "manual-broadcast", resolvedPath, index);
      const trackingPixelUrl = generateTrackingPixelUrl(trackingId, baseUrl);

      const finalSubject = applyTemplate(subjectTemplate, variables);
      const textBody = applyTemplate(bodyTemplate, variables);
      const htmlBody = textBody
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");
      const html = `${htmlBody}<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

      const from = process.env.EMAIL_FROM || smtpConfig.auth.user;
      const fromName = process.env.EMAIL_FROM_NAME;
      const replyTo = process.env.EMAIL_REPLY_TO || from;

      const emailConfig: EmailConfig = {
        provider: "smtp",
        from,
        fromName,
        to: email,
        subject: finalSubject,
        html,
        text: textBody,
        replyTo,
        headers: {
          "X-Tracking-Id": trackingId,
          "X-Broadcast-Type": "manual",
        },
      };

      const result = await sendEmail(emailConfig, smtpConfig);

      if (!result.success) {
        failedCount++;
        logger.error("Failed to send manual broadcast email.", { email, error: result.error });
        continue;
      }

      sentCount++;

      try {
        await updateRowStatus(resolvedPath, index, {
          sent: true,
          sentAt: result.timestamp,
        });
      } catch (updateError) {
        logger.error("Failed to update Excel row for manual broadcast.", {
          email,
          rowIndex: index,
          error: String(updateError),
        });
      }
    }

    return { totalLeads: rows.length, sentCount, failedCount };
  } catch (error) {
    logger.error("Error sending manual broadcast.", { error: String(error), excelPath });
    return { totalLeads: 0, sentCount: 0, failedCount: 0 };
  }
}
