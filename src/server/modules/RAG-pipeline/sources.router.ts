import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../common/config/db/index.js";
import { userTable, sourceTable } from "../../common/config/db/schema.js";
import { ensureUser, checkSourceLimit } from "../auth/middleware.js";

import { parsePDF } from "./indexing/parsers/pdf-parser.js";
import { parseVTT } from "./indexing/parsers/vtt-parser.js";
import { parseWebsite } from "./indexing/parsers/website-parser.js";
import { parseYouTube } from "./indexing/parsers/yt-parser.js";

import { chunkPDF } from "./indexing/chunking/pdf-chunking.js";
import { chunkVTT } from "./indexing/chunking/vtt-chunking.js";
import { chunkWebsite } from "./indexing/chunking/website-chunking.js";
import { chunkYouTube } from "./indexing/chunking/yt-chunking.js";

import { embedAndStore, deleteSourceVectors } from "./indexing/embed.js";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const urlSourceSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["youtube", "website"]),
});

// ── Multer ────────────────────────────────────────────────────────────────────

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".vtt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and VTT files are allowed"));
    }
  },
});

export const sourcesRouter = Router();

// ── POST /sources/file — Upload PDF or VTT ────────────────────────────────────

sourcesRouter.post(
  "/file",
  ensureUser,
  checkSourceLimit,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const filePath = req.file?.path;

    try {
      const { userId } = getAuth(req);

      if (!userId || !req.file) {
        res.status(400).json({ error: "Missing file or auth" });
        return;
      }

      const sourceId = randomUUID();
      const fileName = req.file.originalname;
      const ext = path.extname(fileName).toLowerCase();
      const sourceType = ext === ".pdf" ? "pdf" : "vtt";

      // Insert source row as "indexing"
      await db.insert(sourceTable).values({
        id: sourceId,
        userId,
        name: fileName,
        type: sourceType,
        status: "indexing",
      });

      // Increment source count
      await db
        .update(userTable)
        .set({ sourceCount: sql`${userTable.sourceCount} + 1` })
        .where(eq(userTable.id, userId));

      // Respond immediately — indexing happens in background
      res.status(202).json({ sourceId, status: "indexing" });

      // ── Background indexing ────────────────────────────────────────────────────
      (async () => {
        try {
          let chunks;

          if (sourceType === "pdf") {
            const parsed = await parsePDF(filePath!, fileName);
            chunks = chunkPDF(parsed);
          } else {
            const content = fs.readFileSync(filePath!, "utf-8");
            const parsed = parseVTT(content, fileName);
            chunks = chunkVTT(parsed);
          }

          await embedAndStore({ chunks, userId, sourceId });

          await db
            .update(sourceTable)
            .set({ status: "indexed" })
            .where(eq(sourceTable.id, sourceId));
        } catch (err) {
          console.error("[sources] File indexing failed:", err);
          await db
            .update(sourceTable)
            .set({ status: "failed" })
            .where(eq(sourceTable.id, sourceId));
        } finally {
          if (filePath) fs.unlink(filePath, () => {}); // cleanup temp file
        }
      })();
    } catch (err: any) {
      console.error("❌ Error uploading file source:", err);
      // Clean up temp file if outer handler fails before background task starts
      if (filePath) fs.unlink(filePath, () => {});
      res.status(500).json({ error: err.message || "Failed to process file upload" });
    }
  },
);

// ── POST /sources/url — Add YouTube or Website ────────────────────────────────

sourcesRouter.post(
  "/url",
  ensureUser,
  checkSourceLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsed = urlSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const { url, type } = parsed.data;
      const sourceId = randomUUID();

      await db.insert(sourceTable).values({
        id: sourceId,
        userId,
        name: url,
        type,
        status: "indexing",
      });

      await db
        .update(userTable)
        .set({ sourceCount: sql`${userTable.sourceCount} + 1` })
        .where(eq(userTable.id, userId));

      res.status(202).json({ sourceId, status: "indexing" });

      // ── Background indexing ────────────────────────────────────────────────────
      (async () => {
        try {
          let chunks;

          if (type === "youtube") {
            const parsedYT = await parseYouTube(url);
            chunks = chunkYouTube(parsedYT);
          } else {
            const parsedWeb = await parseWebsite(url);
            chunks = chunkWebsite(parsedWeb);
          }

          await embedAndStore({ chunks, userId, sourceId });

          await db
            .update(sourceTable)
            .set({ status: "indexed" })
            .where(eq(sourceTable.id, sourceId));
        } catch (err) {
          console.error("[sources] URL indexing failed:", err);
          await db
            .update(sourceTable)
            .set({ status: "failed" })
            .where(eq(sourceTable.id, sourceId));
        }
      })();
    } catch (err: any) {
      console.error("❌ Error adding URL source:", err);
      res.status(500).json({ error: err.message || "Failed to process URL source" });
    }
  },
);

// ── GET /sources — List user's sources ───────────────────────────────────────

sourcesRouter.get(
  "/",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sources = await db
        .select()
        .from(sourceTable)
        .where(eq(sourceTable.userId, userId))
        .orderBy(sourceTable.createdAt);

      res.json({ sources });
    } catch (err: any) {
      console.error("❌ Error fetching sources:", err);
      res.json({ sources: [] });
    }
  },
);

// ── DELETE /sources/:id — Remove a source ────────────────────────────────────

sourcesRouter.delete(
  "/:id",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sourceId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      if (!sourceId) {
        res.status(400).json({ error: "Missing source id" });
        return;
      }

      const [source] = await db
        .select()
        .from(sourceTable)
        .where(eq(sourceTable.id, sourceId))
        .limit(1);

      if (!source || source.userId !== userId) {
        res.status(404).json({ error: "Source not found" });
        return;
      }

      // Delete vectors from Pinecone
      try {
        await deleteSourceVectors(userId, sourceId);
      } catch (pErr) {
        console.warn("[sources] Pinecone vector deletion warning:", pErr);
      }

      // Delete row from DB
      await db.delete(sourceTable).where(eq(sourceTable.id, sourceId));

      // Decrement source count (never go below 0)
      await db
        .update(userTable)
        .set({ sourceCount: sql`GREATEST(${userTable.sourceCount} - 1, 0)` })
        .where(eq(userTable.id, userId));

      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ Error deleting source:", err);
      res.status(500).json({ error: err.message || "Failed to delete source" });
    }
  },
);
