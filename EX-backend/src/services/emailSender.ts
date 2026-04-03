import { logger } from "../utils/logger";
import nodemailerLib from "nodemailer";

export interface EmailConfig {
  provider: "gmail" | "smtp";
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
  to: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export async function sendEmailViaGmail(
  emailConfig: EmailConfig,
  gmailConfig: GmailConfig
): Promise<SendResult> {
  const timestamp = new Date().toISOString();

  try {
    if (!nodemailerLib) {
      logger.warn("nodemailer not available, skipping email send");
      return {
        success: false,
        error: "nodemailer not installed",
        timestamp,
      };
    }

    // Create OAuth2 transporter for Gmail
    const transporter = nodemailerLib.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        clientId: gmailConfig.clientId,
        clientSecret: gmailConfig.clientSecret,
        refreshToken: gmailConfig.refreshToken,
      },
    });

    const mailOptions = {
      from: emailConfig.fromName
        ? `${emailConfig.fromName} <${emailConfig.from}>`
        : emailConfig.from,
      to: emailConfig.to,
      replyTo: emailConfig.replyTo || emailConfig.from,
      subject: emailConfig.subject,
      html: emailConfig.html,
      text: emailConfig.text,
      headers: emailConfig.headers || {},
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent via Gmail: ${emailConfig.to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      timestamp,
    };
  } catch (error) {
    logger.error(`Error sending email via Gmail: ${error}`);
    return {
      success: false,
      error: String(error),
      timestamp,
    };
  }
}

export async function sendEmailViaSMTP(
  emailConfig: EmailConfig,
  smtpConfig: SmtpConfig
): Promise<SendResult> {
  const timestamp = new Date().toISOString();

  try {
    if (!nodemailerLib) {
      logger.warn("nodemailer not available, skipping email send");
      return {
        success: false,
        error: "nodemailer not installed",
        timestamp,
      };
    }

    const transporter = nodemailerLib.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    const mailOptions = {
      from: emailConfig.fromName
        ? `${emailConfig.fromName} <${emailConfig.from}>`
        : emailConfig.from,
      to: emailConfig.to,
      replyTo: emailConfig.replyTo || emailConfig.from,
      subject: emailConfig.subject,
      html: emailConfig.html,
      text: emailConfig.text,
      headers: emailConfig.headers || {},
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent via SMTP: ${emailConfig.to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      timestamp,
    };
  } catch (error) {
    logger.error(`Error sending email via SMTP: ${error}`);
    return {
      success: false,
      error: String(error),
      timestamp,
    };
  }
}

export async function sendEmail(
  emailConfig: EmailConfig,
  providerConfig: GmailConfig | SmtpConfig
): Promise<SendResult> {
  if (emailConfig.provider === "gmail") {
    return sendEmailViaGmail(emailConfig, providerConfig as GmailConfig);
  } else if (emailConfig.provider === "smtp") {
    return sendEmailViaSMTP(emailConfig, providerConfig as SmtpConfig);
  } else {
    return {
      success: false,
      error: `Unsupported email provider: ${emailConfig.provider}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function sendBatchEmails(
  emailConfigs: EmailConfig[],
  providerConfig: GmailConfig | SmtpConfig
): Promise<SendResult[]> {
  const results: SendResult[] = [];

  for (const config of emailConfigs) {
    const result = await sendEmail(config, providerConfig);
    results.push(result);

    // Add delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
