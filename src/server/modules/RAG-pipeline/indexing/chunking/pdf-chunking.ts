import type { ParsedPDF } from "../parsers/pdf-parser.js";
import type { Chunk } from "./chunk.types.js";

const MAX_CHUNK_CHARS = 1500; // ~300-400 tokens per chunk
const OVERLAP_CHARS = 200;    // overlap between consecutive chunks for context continuity

/**
 * Splits PDF text into overlapping chunks.
 * Strategy:
 *  1. Split by double newlines (paragraph boundaries)
 *  2. Filter out page marker artifacts like "-- 1 of 12 --"
 *  3. Accumulate paragraphs into chunks with sliding overlap window
 */
export function chunkPDF(parsed: ParsedPDF): Chunk[] {
  const { text, fileName } = parsed;
  const chunks: Chunk[] = [];

  // Helper to check if string is purely a page number artifact like "-- 1 of 12 --"
  const isPageMarker = (str: string) => /^(--\s*\d+\s*of\s*\d+\s*--\s*)+$/gi.test(str.trim());

  // Split into paragraphs on double newlines
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0 && !isPageMarker(p));

  let buffer = "";
  let chunkIndex = 0;

  const flushChunk = () => {
    const trimmed = buffer.trim();
    if (trimmed.length > 0 && !isPageMarker(trimmed)) {
      chunks.push({
        text: trimmed,
        metadata: {
          sourceType: "pdf",
          sourceName: fileName,
          // Rough page hint: assume ~3000 chars per page
          pageHint: Math.floor((chunkIndex * MAX_CHUNK_CHARS) / 3000) + 1,
        },
      });
      chunkIndex++;
    }
  };

  for (const paragraph of paragraphs) {
    // If a single paragraph is too large, split it by sentence
    if (paragraph.length > MAX_CHUNK_CHARS) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph];

      for (const sentence of sentences) {
        if ((buffer + " " + sentence).length > MAX_CHUNK_CHARS) {
          flushChunk();
          // Carry over the last OVERLAP_CHARS of the previous buffer
          buffer = buffer.slice(-OVERLAP_CHARS) + " " + sentence;
        } else {
          buffer = buffer ? buffer + " " + sentence : sentence;
        }
      }
    } else {
      if ((buffer + "\n\n" + paragraph).length > MAX_CHUNK_CHARS) {
        flushChunk();
        buffer = buffer.slice(-OVERLAP_CHARS) + "\n\n" + paragraph;
      } else {
        buffer = buffer ? buffer + "\n\n" + paragraph : paragraph;
      }
    }
  }

  // Flush any remaining text
  flushChunk();

  return chunks;
}
