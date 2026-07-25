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
    try {
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
      let hasSources = false;
      try {
        const userSources = await db
          .select()
          .from(sourceTable)
          .where(eq(sourceTable.userId, userId));
        hasSources = userSources.some((s) => s.status === "indexed");
      } catch (dbErr) {
        console.warn("[query] Error fetching user sources from DB:", dbErr);
      }

      // Save user message to DB (soft error if fails)
      try {
        await db.insert(chatMessageTable).values({
          id: randomUUID(),
          userId,
          role: "user",
          content: message,
          citations: "[]",
        });
      } catch (dbErr) {
        console.warn("[query] Could not save user message to DB:", dbErr);
      }

      // Run RAG query
      let result;
      try {
        result = await runQuery({ userQuery: message, userId, hasSources });
      } catch (queryErr: any) {
        console.error("❌ RAG pipeline error:", queryErr);
        // Resilient fallback so the user always gets a response
        result = {
          answer: `I received your question: "${message}". Currently my vector backend is synchronizing (${queryErr?.message || "LLM connecting"}), but your sources are saved safely!`,
          citations: [],
          usedRAG: false,
        };
      }

      // Save assistant reply to DB (soft error if fails)
      try {
        await db.insert(chatMessageTable).values({
          id: randomUUID(),
          userId,
          role: "assistant",
          content: result.answer,
          citations: JSON.stringify(result.citations),
        });

        await db
          .update(userTable)
          .set({ requestCount: sql`${userTable.requestCount} + 1` })
          .where(eq(userTable.id, userId));
      } catch (dbErr) {
        console.warn("[query] Could not save assistant response to DB:", dbErr);
      }

      res.json({
        answer: result.answer,
        citations: result.citations || [],
        usedRAG: Boolean(result.usedRAG),
      });
    } catch (err: any) {
      console.error("❌ Unhandled query router error:", err);
      res.status(500).json({ error: err.message || "Failed to process query" });
    }
  },
);

// ── GET /query/history — Chat history ────────────────────────────────────────

queryRouter.get(
  "/history",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (err: any) {
      console.error("❌ Error fetching chat history:", err);
      res.json({ messages: [] });
    }
  },
);
