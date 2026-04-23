import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI();

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
- url: URL da fonte
- label: nome legível

Responda em JSON: { "sources": [...] }

Idioma preferido: ${language === "pt" ? "Português" : "English"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a content curation assistant. You suggest high-quality, reliable sources for any topic. Always respond in JSON format.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return suggestedSourcesSchema.parse(JSON.parse(content));
}