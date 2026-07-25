import type { ParsedWebsite } from "../parsers/website-parser.js";
import type { Chunk } from "./chunk.types.js";

const MAX_CHUNK_CHARS = 1500;

/**
 * Chunks website content by section (heading + text).
 * Strategy:
 *  - Each section from the parser = one chunk (already naturally bounded)
 *  - If a section's text exceeds MAX_CHUNK_CHARS, split it into sub-chunks
 *    while preserving the heading in metadata
 */
export function chunkWebsite(parsed: ParsedWebsite): Chunk[] {
  const { sections, url, title } = parsed;
  const chunks: Chunk[] = [];

  for (const section of sections) {
    const fullText = `${section.heading}\n\n${section.text}`;

    if (fullText.length <= MAX_CHUNK_CHARS) {
      // Section fits in a single chunk
      chunks.push({
        text: fullText,
        metadata: {
          sourceType: "website",
          sourceName: title,
          url,
          heading: section.heading,
        },
      });
    } else {
      // Split large sections by sentence
      const sentences = section.text.match(/[^.!?]+[.!?]+/g) ?? [section.text];
      let buffer = section.heading + "\n\n";

      for (const sentence of sentences) {
        if ((buffer + sentence).length > MAX_CHUNK_CHARS) {
          if (buffer.trim().length > 0) {
            chunks.push({
              text: buffer.trim(),
              metadata: {
                sourceType: "website",
                sourceName: title,
                url,
                heading: section.heading,
              },
            });
          }
          // Start next sub-chunk, re-include heading for context
          buffer = section.heading + " (continued)\n\n" + sentence;
        } else {
          buffer += sentence + " ";
        }
      }

      // Flush remaining
      if (buffer.trim().length > 0) {
        chunks.push({
          text: buffer.trim(),
          metadata: {
            sourceType: "website",
            sourceName: title,
            url,
            heading: section.heading,
          },
        });
      }
    }
  }

  return chunks;
}
