import {
  pgTable,
  numeric,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
  id: text("id").primaryKey(),
  requestResetAt: timestamp("request_reset_at").notNull().defaultNow(),
  requestCount: integer("request_count").notNull().default(0),
  sourceCount: integer("source_count").notNull().default(0),
});
