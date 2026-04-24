import { Ollama } from "ollama";
import { z } from "zod";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434",
  headers: process.env.OLLAMA_API_KEY
    ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
    : undefined,
});

const MODEL = process.env.OLLAMA_MODEL || "glm-5.1:cloud";

const suggestedSourcesSchema = z.object({
  sources: z.array(
    z.object({
      type: z.enum(["rss", "newsapi", "reddit", "youtube"]),
      url: z.string(),
      label: z.string(),
    })
  ),
});

export type SuggestedSources = z.infer<typeof suggestedSourcesSchema>;

export async function suggestSourcesForTopic(params: {
  topic: string;
  description?: string;
  language?: string;
}): Promise<SuggestedSources> {
  const { topic, description, language = "pt" } = params;

  const prompt = `Para o tópico "${topic}"${
    description ? ` (${description})` : ""
  }, sugira 3-5 fontes de conteúdo relevantes.

Para cada fonte, forneça:
- type: rss, newsapi, reddit, ou youtube
- url: URL da fonte (deve ser uma URL real e funcional)
- label: nome legível

Responda APENAS em JSON válido, sem markdown, sem explicação extra: { "sources": [...] }

Idioma preferido: ${language === "pt" ? "Português" : "English"}`;

  const response = await ollama.chat({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a content curation assistant. You suggest high-quality, reliable sources for any topic. Always respond in pure JSON format, no markdown fences.",
      },
      { role: "user", content: prompt },
    ],
    format: "json",
    stream: false,
  });

  const content = response.message?.content;
  if (!content) {
    throw new Error("Empty response from model");
  }

  return suggestedSourcesSchema.parse(JSON.parse(content));
}