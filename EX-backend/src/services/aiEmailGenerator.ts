import { logger } from "../utils/logger";

interface GenerateEmailOptions {
  model: "openai" | "ollama";
  apiKey?: string;
  baseUrl?: string;
  template: string;
  variables: Record<string, string>;
  systemPrompt?: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  html: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert email copywriter. Generate personalized, professional emails that are concise, engaging, and include a clear call-to-action. Format your response as JSON with the following structure:
{
  "subject": "Email subject line",
  "body": "Plain text email body",
  "html": "<html email body with basic styling>"
}`;

export async function generateEmailWithAI(options: GenerateEmailOptions): Promise<GeneratedEmail> {
  const {
    model,
    apiKey,
    baseUrl,
    template,
    variables,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
  } = options;

  try {
    if (model === "openai") {
      return await generateWithOpenAI(apiKey, template, variables, systemPrompt);
    } else if (model === "ollama") {
      return await generateWithOllama(baseUrl || "http://localhost:11434", template, variables, systemPrompt);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    logger.error(`Error generating email with AI: ${error}`);
    throw error;
  }
}

async function generateWithOpenAI(
  apiKey: string | undefined,
  template: string,
  variables: Record<string, string>,
  systemPrompt: string
): Promise<GeneratedEmail> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  // Replace variables in template
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    // If response is not JSON, create a simple email
    return {
      subject: "Message from our team",
      body: content,
      html: `<html><body><p>${content}</p></body></html>`,
    };
  }
}

async function generateWithOllama(
  baseUrl: string,
  template: string,
  variables: Record<string, string>,
  systemPrompt: string
): Promise<GeneratedEmail> {
  // Replace variables in template
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral", // Or another available model
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  const content = data.response || "";

  try {
    return JSON.parse(content);
  } catch (e) {
    // If response is not JSON, create a simple email
    return {
      subject: "Message from our team",
      body: content,
      html: `<html><body><p>${content}</p></body></html>`,
    };
  }
}

export function createEmailTemplate(
  subject: string,
  bodyTemplate: string,
  variables?: Record<string, string>
): string {
  let body = bodyTemplate;

  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
  }

  return `Subject: ${subject}\n\n${body}`;
}

export function extractVariablesFromTemplate(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches).map((m) => m[1]);
}
