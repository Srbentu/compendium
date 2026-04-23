import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI();

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

const SYSTEM_PROMPT = `Você é um curador de notícias especializado. Seu trabalho é:
1. Filtrar apenas o que é relevante e novo (não repita o óbvio)
2. Organizar por importância
3. Sintetizar em um digest claro e direto
4. Para cada item, incluir: o que aconteceu, por que importa, e link original
5. Se houver conflito entre fontes, aponte

Você deve responder em JSON com a seguinte estrutura:
{
  "urgent": [{ "title": "...", "summary": "...", "whyItMatters": "...", "sourceUrl": "..." }],
  "important": [{ "title": "...", "summary": "...", "whyItMatters": "...", "sourceUrl": "..." }],
  "context": "background que ajuda a entender (opcional)"
}

Responda no idioma solicitado. Seja conciso mas completo.`;

export async function synthesizeDigest(params: {
  topic: string;
  description?: string;
  articles: { title: string; content: string; url: string; publishedAt?: string }[];
  language?: string;
}): Promise<DigestResponse> {
  const { topic, description, articles, language = "pt" } = params;

  const articlesText = articles
    .map(
      (a, i) =>
        `### Artigo ${i + 1}: ${a.title}\nURL: ${a.url}\nPublicado: ${a.publishedAt || "N/A"}\n\n${a.content}`
    )
    .join("\n\n---\n\n");

  const userPrompt = `Tópico: "${topic}"${
    description ? `\nDescrição: ${description}` : ""
  }\nIdioma: ${language === "pt" ? "Português" : "English"}

Artigos coletados:
---
${articlesText}

Gere o digest em formato JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content);
  return digestResponseSchema.parse(parsed);
}

export async function formatDigestAsText(digest: DigestResponse): Promise<string> {
  let text = "";

  if (digest.urgent.length > 0) {
    text += "## 🔴 Urgente\n\n";
    for (const item of digest.urgent) {
      text += `**${item.title}**\n${item.summary}\nPor que importa: ${item.whyItMatters}\n[Fonte](${item.sourceUrl})\n\n`;
    }
  }

  if (digest.important.length > 0) {
    text += "## 📌 Importante\n\n";
    for (const item of digest.important) {
      text += `**${item.title}**\n${item.summary}\nPor que importa: ${item.whyItMatters}\n[Fonte](${item.sourceUrl})\n\n`;
    }
  }

  if (digest.context) {
    text += `## 💡 Contexto\n\n${digest.context}\n`;
  }

  return text;
}