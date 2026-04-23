import { relations } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
  topics,
  sources,
  rawItems,
  digests,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  topics: many(topics),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  user: one(users, {
    fields: [topics.userId],
    references: [users.id],
  }),
  sources: many(sources),
  digests: many(digests),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  topic: one(topics, {
    fields: [sources.topicId],
    references: [topics.id],
  }),
  rawItems: many(rawItems),
}));

export const rawItemsRelations = relations(rawItems, ({ one }) => ({
  source: one(sources, {
    fields: [rawItems.sourceId],
    references: [sources.id],
  }),
}));

export const digestsRelations = relations(digests, ({ one }) => ({
  topic: one(topics, {
    fields: [digests.topicId],
    references: [topics.id],
  }),
}));