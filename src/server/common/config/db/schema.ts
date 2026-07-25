import { pgTable, serial, numeric, timestamp } from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
  id: serial("id").primaryKey(),
  requestCount: numeric("request_count", { precision: 10, scale: 0 }).notNull(),
  requestResetAt: timestamp("request_reset_at").notNull().defaultNow(),
  sourceCount: numeric("source_count", { precision: 10, scale: 0 }).notNull(),
});
