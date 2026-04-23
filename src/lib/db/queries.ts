import { db } from "@/lib/db";
import { topics, sources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { CreateTopicInput, UpdateTopicInput, CreateSourceInput } from "@/lib/validations/topic";

// --- Topic CRUD ---

export async function getUserTopics(userId: string) {
  return db
    .select()
    .from(topics)
    .where(eq(topics.userId, userId))
    .orderBy(topics.createdAt);
}

export async function getTopicBySlug(userId: string, slug: string) {
  const result = await db
    .select()
    .from(topics)
    .where(and(eq(topics.userId, userId), eq(topics.slug, slug)))
    .limit(1);
  return result[0] ?? null;
}

export async function getTopicById(userId: string, id: string) {
  const result = await db
    .select()
    .from(topics)
    .where(and(eq(topics.userId, userId), eq(topics.id, id)))
    .limit(1);
  return result[0] ?? null;
}

export async function createTopic(userId: string, data: CreateTopicInput) {
  const slug = generateSlug(data.title);
  const [topic] = await db
    .insert(topics)
    .values({
      userId,
      title: data.title,
      slug,
      description: data.description ?? null,
      frequency: data.frequency,
      formatPref: data.formatPref,
      language: data.language,
    })
    .returning();
  return topic;
}

export async function updateTopic(userId: string, id: string, data: UpdateTopicInput) {
  const [topic] = await db
    .update(topics)
    .set({
      ...data,
      slug: data.title ? generateSlug(data.title) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(topics.userId, userId), eq(topics.id, id)))
    .returning();
  return topic;
}

export async function deleteTopic(userId: string, id: string) {
  await db
    .delete(topics)
    .where(and(eq(topics.userId, userId), eq(topics.id, id)));
}

// --- Source CRUD ---

export async function getTopicSources(topicId: string) {
  return db
    .select()
    .from(sources)
    .where(eq(sources.topicId, topicId))
    .orderBy(sources.createdAt);
}

export async function addSource(topicId: string, data: CreateSourceInput) {
  const [source] = await db
    .insert(sources)
    .values({
      topicId,
      type: data.type,
      url: data.url,
      label: data.label ?? null,
      isAuto: data.isAuto,
    })
    .returning();
  return source;
}

export async function deleteSource(topicId: string, sourceId: string) {
  await db
    .delete(sources)
    .where(and(eq(sources.topicId, topicId), eq(sources.id, sourceId)));
}

// --- Helpers ---

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 255);
}