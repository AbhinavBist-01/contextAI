import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { randomUUID } from "crypto";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../common/config/db/index.js";
import {
  notebookTable,
  sourceTable,
  chatMessageTable,
} from "../../common/config/db/schema.js";
import { ensureUser } from "../auth/middleware.js";
import { deleteSourceVectors } from "../RAG-pipeline/indexing/embed.js";

// Preset cover images / gradients for newly created notebooks
export const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60", // Dark Fluid Abstract
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60", // Dark Gradient Wave
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60", // Emerald Nature
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60", // Cosmic Night
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop&q=60", // Neon Synthwave
];

const createNotebookSchema = z.object({
  name: z.string().min(1, "Notebook title cannot be empty").max(100),
  description: z.string().max(300).optional().default(""),
  coverImage: z.string().optional(),
});

const updateNotebookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  coverImage: z.string().optional(),
});

export const notebooksRouter = Router();

// ── GET /notebooks — List all notebooks for authenticated user ───────────────

notebooksRouter.get(
  "/",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      let userNotebooks = await db
        .select()
        .from(notebookTable)
        .where(eq(notebookTable.userId, userId))
        .orderBy(desc(notebookTable.updatedAt));

      // Auto-create default notebook if user has none
      if (userNotebooks.length === 0) {
        const defaultId = randomUUID();
        const defaultCover = COVER_PRESETS[0];

        await db.insert(notebookTable).values({
          id: defaultId,
          userId,
          name: "My AI Knowledge Base",
          description: "Default isolated workspace for research and document indexing.",
          coverImage: defaultCover,
        });

        // Attach any unassigned sources/messages to default notebook
        await db
          .update(sourceTable)
          .set({ notebookId: defaultId })
          .where(sql`${sourceTable.userId} = ${userId} AND ${sourceTable.notebookId} IS NULL`);

        await db
          .update(chatMessageTable)
          .set({ notebookId: defaultId })
          .where(sql`${chatMessageTable.userId} = ${userId} AND ${chatMessageTable.notebookId} IS NULL`);

        userNotebooks = await db
          .select()
          .from(notebookTable)
          .where(eq(notebookTable.userId, userId))
          .orderBy(desc(notebookTable.updatedAt));
      }

      // Gather source count and chat message count per notebook
      const notebooksWithMeta = await Promise.all(
        userNotebooks.map(async (nb) => {
          const sources = await db
            .select({ id: sourceTable.id })
            .from(sourceTable)
            .where(eq(sourceTable.notebookId, nb.id));

          return {
            ...nb,
            sourceCount: sources.length,
          };
        })
      );

      res.json({ notebooks: notebooksWithMeta });
    } catch (err: any) {
      console.error("❌ Error fetching notebooks:", err);
      res.status(500).json({ error: err.message || "Failed to fetch notebooks" });
    }
  }
);

// ── POST /notebooks — Create a new notebook ─────────────────────────────────

notebooksRouter.post(
  "/",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsed = createNotebookSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const { name, description, coverImage } = parsed.data;
      const notebookId = randomUUID();
      const selectedCover =
        coverImage || COVER_PRESETS[Math.floor(Math.random() * COVER_PRESETS.length)];

      const [newNotebook] = await db
        .insert(notebookTable)
        .values({
          id: notebookId,
          userId,
          name,
          description,
          coverImage: selectedCover,
        })
        .returning();

      res.status(201).json({ notebook: { ...newNotebook, sourceCount: 0 } });
    } catch (err: any) {
      console.error("❌ Error creating notebook:", err);
      res.status(500).json({ error: err.message || "Failed to create notebook" });
    }
  }
);

// ── GET /notebooks/:id — Fetch single notebook details ────────────────────────

notebooksRouter.get(
  "/:id",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const [notebook] = await db
        .select()
        .from(notebookTable)
        .where(sql`${notebookTable.id} = ${id} AND ${notebookTable.userId} = ${userId}`)
        .limit(1);

      if (!notebook) {
        res.status(404).json({ error: "Notebook not found" });
        return;
      }

      const sources = await db
        .select({ id: sourceTable.id })
        .from(sourceTable)
        .where(eq(sourceTable.notebookId, notebook.id));

      res.json({ notebook: { ...notebook, sourceCount: sources.length } });
    } catch (err: any) {
      console.error("❌ Error fetching notebook details:", err);
      res.status(500).json({ error: err.message || "Failed to fetch notebook" });
    }
  }
);

// ── PATCH /notebooks/:id — Update notebook ────────────────────────────────────

notebooksRouter.patch(
  "/:id",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsed = updateNotebookSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const updates = parsed.data;

      const [updated] = await db
        .update(notebookTable)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(sql`${notebookTable.id} = ${id} AND ${notebookTable.userId} = ${userId}`)
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Notebook not found" });
        return;
      }

      res.json({ notebook: updated });
    } catch (err: any) {
      console.error("❌ Error updating notebook:", err);
      res.status(500).json({ error: err.message || "Failed to update notebook" });
    }
  }
);

// ── DELETE /notebooks/:id — Delete notebook ───────────────────────────────────

notebooksRouter.delete(
  "/:id",
  ensureUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Check ownership
      const [notebook] = await db
        .select()
        .from(notebookTable)
        .where(sql`${notebookTable.id} = ${id} AND ${notebookTable.userId} = ${userId}`)
        .limit(1);

      if (!notebook) {
        res.status(404).json({ error: "Notebook not found" });
        return;
      }

      // Delete vectors from Pinecone for all sources in this notebook
      const sources = await db
        .select()
        .from(sourceTable)
        .where(eq(sourceTable.notebookId, id));

      for (const src of sources) {
        try {
          await deleteSourceVectors(userId, src.id);
        } catch (vecErr) {
          console.warn(`[notebooks] Pinecone vector delete warning for source ${src.id}:`, vecErr);
        }
      }

      // Delete notebook row (cascades DB sources and chat messages)
      await db.delete(notebookTable).where(eq(notebookTable.id, id));

      res.json({ success: true, message: "Notebook deleted successfully" });
    } catch (err: any) {
      console.error("❌ Error deleting notebook:", err);
      res.status(500).json({ error: err.message || "Failed to delete notebook" });
    }
  }
);
