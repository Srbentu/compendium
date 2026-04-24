import { Ollama } from "ollama";
import { z } from "zod";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434",
  headers: process.env.OLLAMA_API_KEY
    ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
    : undefined,
});

const MODEL = process.env.OLLAMA_MODEL || "glm-5.1:cloud";

const digestResponseSchema = z.object({
  urgent: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      whyItMatters: z.string(),
      sourceUrl: z.string(),
    })
  ),
  important: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      whyItMatters: z.string(),
      sourceUrl: z.string(),
    })
  ),
  context: z.string().optional(),
});

export type DigestResponse = z.infer<typeof digestResponseSchema>;

const SYSTEM_PROMPT = `You are a specialized news curator. Your job is:
1. Filter only what is relevant and new (do not repeat the obvious)
2. Organize by importance
3. Synthesize into a clear and direct digest
4. For each item, include: what happened, why it matters, and original link
5. If there is conflict between sources, point it out

You must respond in pure JSON with the following structure (no markdown, no code fences):
{
  "urgent": [{ "title": "...", "summary": "...", "whyItMatters": "...", "sourceUrl": "..." }],
  "important": [{ "title": "...", "summary": "...", "whyItMatters": "...", "sourceUrl": "..." }],
  "context": "background that helps understand (optional)"
}

Respond in the requested language. Be concise but complete.`;

export async function synthesizeDigest(params: {
  topic: string;
  description?: string;
  articles: { title: string; content: string; url: string; publishedAt?: string }[];
  language?: string;
}): Promise<DigestResponse> {
  const { topic, description, articles, language = "en" } = params;

  const articlesText = articles
    .map(
      (a, i) =>
        `### Article ${i + 1}: ${a.title}\nURL: ${a.url}\nPublished: ${a.publishedAt || "N/A"}\n\n${a.content}`
    )
    .join("\n\n---\n\n");

  const userPrompt = `Topic: "${topic}"${
    description ? `\nDescription: ${description}` : ""
  }\nLanguage: ${language === "pt" ? "Portuguese" : "English"}

Collected articles:
---
${articlesText}

Generate the digest in pure JSON format.`;

  const response = await ollama.chat({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    format: "json",
    stream: false,
  });

  const content = response.message?.content;
  if (!content) {
    throw new Error("Empty response from model");
  }

  const parsed = JSON.parse(content);
  return digestResponseSchema.parse(parsed);
}

export async function formatDigestAsText(digest: DigestResponse): Promise<string> {
  let text = "";

  if (digest.urgent.length > 0) {
    text += "## 🔴 Urgent\n\n";
    for (const item of digest.urgent) {
      text += `**${item.title}**\n${item.summary}\nWhy it matters: ${item.whyItMatters}\n[Source](${item.sourceUrl})\n\n`;
    }
  }

  if (digest.important.length > 0) {
    text += "## 📌 Important\n\n";
    for (const item of digest.important) {
      text += `**${item.title}**\n${item.summary}\nWhy it matters: ${item.whyItMatters}\n[Source](${item.sourceUrl})\n\n`;
    }
  }

  if (digest.context) {
    text += `## 💡 Context\n\n${digest.context}\n`;
  }

  return text;
}