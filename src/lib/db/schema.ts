import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  primaryKey,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const frequencyEnum = pgEnum("frequency", ["daily", "weekly"]);
export const formatPrefEnum = pgEnum("format_pref", ["text", "audio", "both"]);
export const sourceTypeEnum = pgEnum("source_type", [
  "rss",
  "newsapi",
  "reddit",
  "youtube",
]);
export const digestStatusEnum = pgEnum("digest_status", [
  "pending",
  "generating",
  "generated",
  "delivered",
  "failed",
]);

// --- Auth.js v5 required tables (compatible with DrizzleAdapter) ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  })
);

// --- App tables ---

export const topics = pgTable("topics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  frequency: frequencyEnum("frequency").default("daily").notNull(),
  formatPref: formatPrefEnum("format_pref").default("text").notNull(),
  language: varchar("language", { length: 5 }).default("pt").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sources = pgTable("sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  topicId: text("topic_id")
    .references(() => topics.id, { onDelete: "cascade" })
    .notNull(),
  type: sourceTypeEnum("type").notNull(),
  url: text("url").notNull(),
  label: varchar("label", { length: 255 }),
  isAuto: boolean("is_auto").default(true).notNull(),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rawItems = pgTable("raw_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sourceId: text("source_id")
    .references(() => sources.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

export const digests = pgTable("digests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  topicId: text("topic_id")
    .references(() => topics.id, { onDelete: "cascade" })
    .notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  textContent: text("text_content").notNull(),
  audioUrl: text("audio_url"),
  audioDurationSeconds: integer("audio_duration_seconds"),
  status: digestStatusEnum("status").default("generated").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});