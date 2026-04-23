import { z } from "zod";

const NEWSAPI_BASE_URL = "https://newsapi.org/v2";

const newsApiResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(
    z.object({
      source: z.object({
        id: z.string().nullable(),
        name: z.string(),
      }),
      author: z.string().nullable(),
      title: z.string(),
      description: z.string().nullable(),
      url: z.string(),
      urlToImage: z.string().nullable(),
      publishedAt: z.string().nullable(),
      content: z.string().nullable(),
    })
  ),
});

export interface NewsAPIItem {
  title: string;
  content: string;
  url: string;
  publishedAt: string | null;
  author: string | null;
  sourceName: string;
}

export interface NewsAPIFetchResult {
  items: NewsAPIItem[];
  totalResults: number;
  fetchedAt: Date;
  error?: string;
}

export async function fetchNewsAPI(
  query: string,
  apiKey: string,
  options?: {
    language?: "pt" | "en";
    pageSize?: number;
    sortBy?: "relevancy" | "popularity" | "publishedAt";
  }
): Promise<NewsAPIFetchResult> {
  const {
    language = "pt",
    pageSize = 20,
    sortBy = "publishedAt",
  } = options || {};

  try {
    const url = new URL(`${NEWSAPI_BASE_URL}/everything`);
    url.searchParams.set("q", query);
    url.searchParams.set("language", language);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("sortBy", sortBy);
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
    }

    const data = newsApiResponseSchema.parse(await response.json());

    const items: NewsAPIItem[] = data.articles
      .filter((a) => a.title && a.url && a.title !== "[Removed]")
      .map((article) => ({
        title: article.title,
        content: article.content || article.description || "",
        url: article.url,
        publishedAt: article.publishedAt,
        author: article.author,
        sourceName: article.source.name,
      }));

    return {
      items,
      totalResults: data.totalResults,
      fetchedAt: new Date(),
    };
  } catch (error) {
    return {
      items: [],
      totalResults: 0,
      fetchedAt: new Date(),
      error: error instanceof Error ? error.message : "Unknown error fetching NewsAPI",
    };
  }
}