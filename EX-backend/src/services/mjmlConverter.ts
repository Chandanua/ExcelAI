import { logger } from "../utils/logger";

interface MJMLConversionResult {
  html: string;
  errors: string[];
}

let mjmlLib: any = null;

try {
  mjmlLib = require("mjml");
} catch (e) {
  logger.warn("mjml library not found. Install with: npm install mjml");
}

export function convertMjmlToHtml(mjmlContent: string): MJMLConversionResult {
  try {
    if (!mjmlLib) {
      // Fallback: Return the content as-is with a warning
      logger.warn("MJML library not available, returning content as-is");
      return {
        html: mjmlContent,
        errors: ["MJML library not installed"],
      };
    }

    // Render MJML
    const result = mjmlLib(mjmlContent);

    if (result.errors && result.errors.length > 0) {
      logger.warn(`MJML conversion errors: ${result.errors.join(", ")}`);
      return {
        html: result.html || "",
        errors: result.errors.map((e: any) => e.message || String(e)),
      };
    }

    return {
      html: result.html || "",
      errors: [],
    };
  } catch (error) {
    logger.error(`Error converting MJML: ${error}`);
    return {
      html: "",
      errors: [`Conversion error: ${error}`],
    };
  }
}

export function createMjmlTemplate(config: {
  title?: string;
  previewText?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  body: string;
  footerText?: string;
  unsubscribeUrl?: string;
}): string {
  const {
    title = "Hello",
    previewText = "",
    body,
    footerText = "© 2024 Your Company. All rights reserved.",
    unsubscribeUrl,
  } = config;

  return `<mjml>
  <mj-head>
    <mj-title>${title}</mj-title>
    <mj-preview>${previewText}</mj-preview>
    <mj-style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      a {
        color: #0066cc;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f5f5f5">
    <mj-section>
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="bold" color="#333333" padding="20px 0">
          ${title}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section background-color="#ffffff">
      <mj-column>
        <mj-text font-size="14px" line-height="1.6" color="#666666" padding="20px">
          ${body}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section>
      <mj-column>
        <mj-text align="center" font-size="12px" color="#999999" padding="20px">
          ${footerText}
          ${
            unsubscribeUrl
              ? `<br/><a href="${unsubscribeUrl}">Unsubscribe</a>`
              : ""
          }
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

export function createSimpleHtmlTemplate(config: {
  title?: string;
  subject?: string;
  body: string;
  footerText?: string;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
}): string {
  const {
    title = "Hello",
    body,
    footerText = "© 2024 Your Company. All rights reserved.",
    unsubscribeUrl,
    trackingPixelUrl,
  } = config;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      padding: 20px;
      border-bottom: 1px solid #eeeeee;
    }
    .content {
      padding: 20px;
      color: #666666;
      line-height: 1.6;
    }
    .footer {
      padding: 20px;
      border-top: 1px solid #eeeeee;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; color: #333333;">${title}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      ${footerText}
      ${unsubscribeUrl ? `<br/><a href="${unsubscribeUrl}">Unsubscribe</a>` : ""}
    </div>
  </div>
  ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />` : ""}
</body>
</html>`;
}

export function addTrackingPixel(html: string, pixelUrl: string): string {
  // Add tracking pixel before closing body tag
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${trackingPixel}</body>`);
  }

  // If no body tag, append at the end
  return html + trackingPixel;
}
