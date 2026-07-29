import {
  pgTable,
  timestamp,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const sourceTypeEnum = pgEnum("source_type", [
  "pdf",
  "vtt",
  "youtube",
  "website",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "indexing",
  "indexed",
  "failed",
]);

// ── Users ─────────────────────────────────────────────────────────────────────

export const userTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk userId e.g. "user_2abc..."
  requestCount: integer("request_count").notNull().default(0),
  requestResetAt: timestamp("request_reset_at").notNull().defaultNow(),
  sourceCount: integer("source_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Notebooks ─────────────────────────────────────────────────────────────────

export const notebookTable = pgTable("notebooks", {
  id: text("id").primaryKey(),           // uuid
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),          // title of the notebook
  description: text("description").default(""),
  coverImage: text("cover_image").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Sources ───────────────────────────────────────────────────────────────────

export const sourceTable = pgTable("sources", {
  id: text("id").primaryKey(),           // uuid generated at route level
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  notebookId: text("notebook_id")
    .references(() => notebookTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),          // file name or URL
  type: sourceTypeEnum("type").notNull(),
  status: sourceStatusEnum("status").notNull().default("indexing"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Chat Messages ─────────────────────────────────────────────────────────────

export const chatMessageTable = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  notebookId: text("notebook_id")
    .references(() => notebookTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  citations: text("citations").default("[]"), // JSON stringified SourceCitation[]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
