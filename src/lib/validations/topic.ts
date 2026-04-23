import { z } from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255),
  description: z.string().max(1000).optional(),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  formatPref: z.enum(["text", "audio", "both"]).default("text"),
  language: z.string().min(2).max(5).default("pt"),
});

export const updateTopicSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  formatPref: z.enum(["text", "audio", "both"]).optional(),
  language: z.string().min(2).max(5).optional(),
  active: z.boolean().optional(),
});

export const topicSlugSchema = z.object({
  slug: z.string().min(1),
});

export const createSourceSchema = z.object({
  type: z.enum(["rss", "newsapi", "reddit", "youtube"]),
  url: z.string().url("Invalid URL"),
  label: z.string().max(255).optional(),
  isAuto: z.boolean().default(true),
});

export const digestQuerySchema = z.object({
  topicId: z.string().uuid().optional(),
  date: z.string().date().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type DigestQuery = z.infer<typeof digestQuerySchema>;