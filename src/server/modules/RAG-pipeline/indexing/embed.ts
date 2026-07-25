import "dotenv/config";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import type { Chunk } from "./chunking/chunk.types.js";

// ── Clients ──────────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

// ── Constants ─────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dimensions
const BATCH_SIZE = 100; // Pinecone upsert limit per request

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbedAndStoreOptions {
  chunks: Chunk[];
  userId: string;   // Clerk userId — used to namespace vectors per user
  sourceId: string; // DB source record ID — used to group/delete by source
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Embeds an array of Chunk[] using OpenAI and upserts them into Pinecone.
 * Vectors are namespaced by userId so each user's data is isolated.
 *
 * @param options.chunks    - Chunks from any chunker (pdf, vtt, website, yt)
 * @param options.userId    - Clerk userId for namespacing in Pinecone
 * @param options.sourceId  - DB source ID stored in metadata for later deletion
 */
export async function embedAndStore(options: EmbedAndStoreOptions): Promise<void> {
  const { chunks, userId, sourceId } = options;

  if (chunks.length === 0) {
    console.warn("[embed] No chunks to embed — skipping.");
    return;
  }

  console.log(`[embed] Embedding ${chunks.length} chunks for user ${userId}...`);

  // ── Step 1: Generate embeddings in batches ─────────────────────────────────
  // OpenAI allows up to 2048 inputs per request but we batch conservatively
  const allVectors: { id: string; values: number[]; metadata: Record<string, string | number> }[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const texts = batchChunks.map((c) => c.text);

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    for (let j = 0; j < batchChunks.length; j++) {
      const chunk = batchChunks[j]!;
      const embedding = embeddingResponse.data[j]!;

      // Build a deterministic vector ID: sourceId + chunk index
      const vectorId = `${sourceId}__chunk__${i + j}`;

      // Flatten metadata — Pinecone only supports string | number | boolean values
      const metadata: Record<string, string | number> = {
        sourceId,
        userId,
        text: chunk.text,
        sourceType: chunk.metadata.sourceType,
        sourceName: chunk.metadata.sourceName,
      };

      // Conditionally add optional metadata fields
      if (chunk.metadata.pageHint !== undefined)
        metadata.pageHint = chunk.metadata.pageHint;
      if (chunk.metadata.startTime !== undefined)
        metadata.startTime = chunk.metadata.startTime;
      if (chunk.metadata.endTime !== undefined)
        metadata.endTime = chunk.metadata.endTime;
      if (chunk.metadata.heading !== undefined)
        metadata.heading = chunk.metadata.heading;
      if (chunk.metadata.url !== undefined)
        metadata.url = chunk.metadata.url;

      allVectors.push({
        id: vectorId,
        values: embedding.embedding,
        metadata,
      });
    }

    console.log(`[embed] Batch ${Math.floor(i / BATCH_SIZE) + 1} embedded (${batchChunks.length} chunks)`);
  }

  // ── Step 2: Upsert into Pinecone (namespaced per user) ─────────────────────
  // Namespace isolates each user's vectors — prevents cross-user data leakage
  const namespacedIndex = index.namespace(userId);

  for (let i = 0; i < allVectors.length; i += BATCH_SIZE) {
    const batch = allVectors.slice(i, i + BATCH_SIZE);
    await namespacedIndex.upsert({ records: batch });
    console.log(`[embed] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} into Pinecone`);
  }

  console.log(`[embed] ✅ Done — ${allVectors.length} vectors stored for source ${sourceId}`);
}

// ── Delete helpers ─────────────────────────────────────────────────────────────

/**
 * Deletes all vectors for a given sourceId from a user's namespace.
 * Called when a user removes a source.
 */
export async function deleteSourceVectors(userId: string, sourceId: string): Promise<void> {
  const namespacedIndex = index.namespace(userId);

  // Fetch vector IDs matching this sourceId using metadata filter
  await namespacedIndex.deleteMany({
    filter: { sourceId: { $eq: sourceId } },
  });

  console.log(`[embed] 🗑 Deleted vectors for source ${sourceId}`);
}
