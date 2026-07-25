import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../common/config/db/index.js";
import { userTable, sourceTable } from "../../common/config/db/schema.js";
import { ensureUser, checkSourceLimit } from "../auth/middleware.js";

// ── Parsers ───────────────────────────────────────────────────────────────────
import { parsePDF } from "./indexing/parsers/pdf-parser.js";
import { parseVTT } from "./indexing/parsers/vtt-parser.js";
import { parseWebsite } from "./indexing/parsers/website-parser.js";
import { parseYouTube } from "./indexing/parsers/yt-parser.js";

// ── Chunkers ──────────────────────────────────────────────────────────────────
import { chunkPDF } from "./indexing/chunking/pdf-chunking.js";
import { chunkVTT } from "./indexing/chunking/vtt-chunking.js";
import { chunkWebsite } from "./indexing/chunking/website-chunking.js";
import { chunkYouTube } from "./indexing/chunking/yt-chunking.js";

// ── Embed ─────────────────────────────────────────────────────────────────────
import { embedAndStore, deleteSourceVectors } from "./indexing/embed.js";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const urlSourceSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["youtube", "website"]),
});

// ── Multer — file upload config ───────────────────────────────────────────────

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
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
    const { userId } = getAuth(req);
    if (!userId || !req.file) {
      res.status(400).json({ error: "Missing file or auth" });
      return;
    }

    const sourceId = randomUUID();
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();
    const filePath = req.file.path;
    const sourceType = ext === ".pdf" ? "pdf" : "vtt";

    // Insert source as "indexing"
    await db.insert(sourceTable).values({
      id: sourceId,
      userId,
      name: fileName,
      type: sourceType,
      status: "indexing",
    });

    // Increment user source count
    await db
      .update(userTable)
      .set({ sourceCount: db.$count(sourceTable, eq(sourceTable.userId, userId)) as unknown as number })
      .where(eq(userTable.id, userId));

    res.status(202).json({ sourceId, status: "indexing" });

    // ── Background indexing (non-blocking) ────────────────────────────────────
    (async () => {
      try {
        let chunks;

        if (sourceType === "pdf") {
          const parsed = await parsePDF(filePath, fileName);
          chunks = chunkPDF(parsed);
        } else {
          const content = fs.readFileSync(filePath, "utf-8");
          const parsed = parseVTT(content, fileName);
          chunks = chunkVTT(parsed);
        }

        await embedAndStore({ chunks, userId, sourceId });

        await db
          .update(sourceTable)
          .set({ status: "indexed" })
          .where(eq(sourceTable.id, sourceId));
      } catch (err) {
        console.error("[sources] Indexing failed:", err);
        await db
          .update(sourceTable)
          .set({ status: "failed" })
          .where(eq(sourceTable.id, sourceId));
      } finally {
        // Clean up temp upload file
        fs.unlink(filePath, () => {});
      }
    })();
  }
);

// ── POST /sources/url — Add YouTube or Website ────────────────────────────────

sourcesRouter.post(
  "/url",
  ensureUser,
  checkSourceLimit,
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

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
  }
);

// ── GET /sources — List user's sources ───────────────────────────────────────

sourcesRouter.get("/", ensureUser, async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const sources = await db
    .select()
    .from(sourceTable)
    .where(eq(sourceTable.userId, userId))
    .orderBy(sourceTable.createdAt);

  res.json({ sources });
});

// ── DELETE /sources/:id — Remove a source ────────────────────────────────────

sourcesRouter.delete("/:id", ensureUser, async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const sourceId = req.params.id;

  const [source] = await db
    .select()
    .from(sourceTable)
    .where(eq(sourceTable.id, sourceId!))
    .limit(1);

  if (!source || source.userId !== userId) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  // Delete from Pinecone
  await deleteSourceVectors(userId, sourceId!);

  // Delete from DB
  await db.delete(sourceTable).where(eq(sourceTable.id, sourceId!));

  // Decrement source count
  await db
    .update(userTable)
    .set({ sourceCount: db.$count(sourceTable, eq(sourceTable.userId, userId)) as unknown as number })
    .where(eq(userTable.id, userId));

  res.json({ success: true });
});
