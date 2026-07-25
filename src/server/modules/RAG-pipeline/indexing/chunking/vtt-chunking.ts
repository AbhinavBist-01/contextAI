import type { ParsedVTT } from "../parsers/vtt-parser.js";
import type { Chunk } from "./chunk.types.js";

const WINDOW_SECONDS = 45; // group cues that fall within this time window into one chunk

/**
 * Chunks VTT cues into time-window groups.
 * Strategy: group all cues whose startTime falls within a 45-second window,
 * then start a new chunk. Preserves the start/end timestamp of the window.
 *
 * VTT timestamps are in format: "HH:MM:SS.mmm"
 */
export function chunkVTT(parsed: ParsedVTT): Chunk[] {
  const { cues, fileName } = parsed;
  if (cues.length === 0) return [];

  const chunks: Chunk[] = [];
  let windowStart = vttTimeToSeconds(cues[0]!.startTime);
  let currentCues = [cues[0]!];

  for (let i = 1; i < cues.length; i++) {
    const cue = cues[i]!;
    const cueStart = vttTimeToSeconds(cue.startTime);

    if (cueStart - windowStart <= WINDOW_SECONDS) {
      // Still within the window — add to current group
      currentCues.push(cue);
    } else {
      // Flush current window as a chunk
      chunks.push(buildVTTChunk(currentCues, fileName));
      // Start new window
      windowStart = cueStart;
      currentCues = [cue];
    }
  }

  // Flush final window
  if (currentCues.length > 0) {
    chunks.push(buildVTTChunk(currentCues, fileName));
  }

  return chunks;
}

function buildVTTChunk(cues: ParsedVTT["cues"], fileName: string): Chunk {
  return {
    text: cues.map((c) => c.text).join(" "),
    metadata: {
      sourceType: "vtt",
      sourceName: fileName,
      startTime: cues[0]!.startTime,
      endTime: cues[cues.length - 1]!.endTime,
    },
  };
}

/** Converts "HH:MM:SS.mmm" or "MM:SS.mmm" to total seconds */
function vttTimeToSeconds(timestamp: string): number {
  const parts = timestamp.split(":").map(parseFloat);
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    return (parts[0]! * 3600) + (parts[1]! * 60) + parts[2]!;
  } else {
    // MM:SS.mmm
    return (parts[0]! * 60) + parts[1]!;
  }
}
