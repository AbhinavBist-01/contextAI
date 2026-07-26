import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

export const db = (drizzle as any)(process.env.DATABASE_URL, { schema });
