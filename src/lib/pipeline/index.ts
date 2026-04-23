import { fetchRSSFeed } from "./fetchers/rss";
import { fetchNewsAPI } from "./fetchers/newsapi";
import { db } from "@/lib/db";
import { sources, rawItems, topics, digests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { synthesizeDigest, formatDigestAsText } from "@/lib/ai/digest";
import { textToSpeech } from "@/lib/tts";

export interface PipelineItem {
  title: string;
  content: string;
  url: string;
  publishedAt: string | null;
}

/**
 * Run the full pipeline for a single topic:
 * 1. Fetch items from all active sources
 * 2. Store raw items
 * 3. Synthesize digest via AI
 * 4. Generate audio if needed
 * 5. Store digest
 */
export async function runTopicPipeline(topicId: string): Promise<void> {
  // 1. Get topic with sources
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      sources: {
        where: eq(sources.active, true),
      },
    },
  });
  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }

  // 2. Fetch from all sources
  const allItems: PipelineItem[] = [];

  for (const source of topic.sources) {
    let items: PipelineItem[] = [];

    switch (source.type) {
      case "rss": {
        const result = await fetchRSSFeed(source.url);
        if (result.error) {
          console.error(`RSS error for ${source.url}: ${result.error}`);
          continue;
        }
        items = result.items;
        break;
      }
      case "newsapi": {
        const apiKey = process.env.NEWSAPI_KEY;
        if (!apiKey) {
          console.error("NEWSAPI_KEY not configured");
          continue;
        }
        const result = await fetchNewsAPI(topic.title, apiKey, {
          language: topic.language as "pt" | "en",
        });
        if (result.error) {
          console.error(`NewsAPI error: ${result.error}`);
          continue;
        }
        items = result.items;
        break;
      }
      default:
        console.warn(`Source type not yet supported: ${source.type}`);
        continue;
    }

    // Store raw items
    if (items.length > 0) {
      await db.insert(rawItems).values(
        items.map((item) => ({
          sourceId: source.id,
          url: item.url,
          title: item.title,
          content: item.content,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        }))
      );

      // Update last fetched
      await db
        .update(sources)
        .set({ lastFetchedAt: new Date() })
        .where(eq(sources.id, source.id));
    }

    allItems.push(...items);
  }

  if (allItems.length === 0) {
    console.log(`No items found for topic: ${topic.title}`);
    return;
  }

  // 3. Synthesize digest
  const digestResponse = await synthesizeDigest({
    topic: topic.title,
    description: topic.description || undefined,
    articles: allItems.map((item) => ({
      title: item.title,
      content: item.content,
      url: item.url,
      publishedAt: item.publishedAt || undefined,
    })),
    language: topic.language,
  });

  const textContent = await formatDigestAsText(digestResponse);

  // 4. Generate audio if needed
  let audioUrl: string | null = null;
  let audioDurationSeconds: number | null = null;

  if (topic.formatPref === "audio" || topic.formatPref === "both") {
    try {
      const ttsResult = await textToSpeech({
        text: textContent,
        voice: "nova",
      });

      // TODO: Upload to R2 and get public URL
      // audioUrl = await uploadToR2(ttsResult.audioBuffer, ...);
      audioDurationSeconds = ttsResult.durationSeconds;
    } catch (error) {
      console.error(`TTS error for topic ${topic.title}:`, error);
    }
  }

  // 5. Store digest
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);

  await db.insert(digests).values({
    topicId: topic.id,
    periodStart,
    periodEnd: now,
    textContent,
    audioUrl,
    audioDurationSeconds,
    status: "generated",
  });

  console.log(`Digest generated for topic: ${topic.title}`);
}