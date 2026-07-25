import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

import { db } from "../../common/config/db/index.js";
import {
  userTable,
  sourceTable,
  chatMessageTable,
} from "../../common/config/db/schema.js";
import { ensureUser, checkRateLimit } from "../auth/middleware.js";
import { runQuery } from "./user-query/query.js";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const queryInputSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});

const citationSchema = z.object({
  sourceName: z.string(),
  sourceType: z.string(),
  url: z.string().optional(),
  heading: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pageHint: z.number().optional(),
  text: z.string(),
});

const queryOutputSchema = z.object({
  answer: z.string(),
  citations: z.array(citationSchema),
  usedRAG: z.boolean(),
});

export const queryRouter = Router();

// ── POST /query — Main chat endpoint ─────────────────────────────────────────

queryRouter.post(
  "/",
  ensureUser,
  checkRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate input
    const inputParsed = queryInputSchema.safeParse(req.body);
    if (!inputParsed.success) {
      res.status(400).json({ error: inputParsed.error.flatten() });
      return;
    }

    const { message } = inputParsed.data;

    // Check if user has any indexed sources
    const userSources = await db
      .select()
      .from(sourceTable)
      .where(eq(sourceTable.userId, userId));

    const hasSources = userSources.some((s) => s.status === "indexed");

    // Save user message
    await db.insert(chatMessageTable).values({
      id: randomUUID(),
      userId,
      role: "user",
      content: message,
      citations: "[]",
    });

    // Run the RAG pipeline
    const result = await runQuery({ userQuery: message, userId, hasSources });

    // Validate output
    const outputParsed = queryOutputSchema.safeParse(result);
    if (!outputParsed.success) {
      res.status(500).json({ error: "Invalid response format from AI" });
      return;
    }

    // Save assistant reply
    await db.insert(chatMessageTable).values({
      id: randomUUID(),
      userId,
      role: "assistant",
      content: result.answer,
      citations: JSON.stringify(result.citations),
    });

    // Increment request count atomically
    await db
      .update(userTable)
      .set({ requestCount: sql`${userTable.requestCount} + 1` })
      .where(eq(userTable.id, userId));

    res.json(outputParsed.data);
  },
);

// ── GET /query/history — Chat history ────────────────────────────────────────

queryRouter.get(
  "/history",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const messages = await db
      .select()
      .from(chatMessageTable)
      .where(eq(chatMessageTable.userId, userId))
      .orderBy(chatMessageTable.createdAt);

    res.json({
      messages: messages.map((m) => ({
        ...m,
        citations: JSON.parse(m.citations ?? "[]") as unknown[],
      })),
    });
  },
);
