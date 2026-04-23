import Parser from "rss-parser";
import { z } from "zod";

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Compendium/1.0 RSS Fetcher",
  },
});

export interface RSSItem {
  title: string;
  content: string;
  url: string;
  publishedAt: string | null;
  author: string | null;
}

export interface RSSFetchResult {
  items: RSSItem[];
  feedTitle: string;
  fetchedAt: Date;
  error?: string;
}

export async function fetchRSSFeed(feedUrl: string): Promise<RSSFetchResult> {
  try {
    const feed = await rssParser.parseURL(feedUrl);

    const items: RSSItem[] = (feed.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title || "",
        content: item.contentSnippet || item.content || item.summary || "",
        url: item.link || "",
        publishedAt: item.isoDate || item.pubDate || null,
        author: item.creator || item.author || null,
      }));

    return {
      items,
      feedTitle: feed.title || feedUrl,
      fetchedAt: new Date(),
    };
  } catch (error) {
    return {
      items: [],
      feedTitle: feedUrl,
      fetchedAt: new Date(),
      error: error instanceof Error ? error.message : "Unknown error fetching RSS",
    };
  }
}