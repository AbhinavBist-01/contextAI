/**
 * A single chunk of text ready to be embedded and stored in the vector DB.
 * Every chunker — regardless of source type — must return Chunk[].
 */
export interface Chunk {
  text: string;       // The actual text content to embed
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  sourceType: "pdf" | "vtt" | "website" | "youtube";
  sourceName: string;   // file name or URL
  // PDF specific
  pageHint?: number;    // approximate page number
  // VTT / YouTube specific
  startTime?: string;   // e.g. "00:01:15.000" or "75.4" (seconds)
  endTime?: string;
  // Website specific
  heading?: string;     // the section heading this chunk belongs to
  url?: string;
}
