import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  defaultTone: text("default_tone").notNull().default("professional"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  contextType: text("context_type").notNull(), // see CONTEXTS in src/lib/constants.ts
  rawInput: text("raw_input").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rewrites = pgTable("rewrites", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id),
  tone: text("tone").notNull(), // see TONES in src/lib/constants.ts
  outputText: text("output_text").notNull(),
  explanation: text("explanation").notNull(),
  modelUsed: text("model_used").notNull(),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per user, overwritten each time they regenerate — this is a
// point-in-time analysis, not a history, so there's nothing to keep past
// the latest run.
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  tips: jsonb("tips").notNull(), // WritingPattern[] — see src/lib/llm/types.ts
  messageCount: integer("message_count").notNull(), // how many past messages this run was based on
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
