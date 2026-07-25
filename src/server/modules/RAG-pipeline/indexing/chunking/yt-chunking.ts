import type { ParsedYouTube } from "../parsers/yt-parser.js";
import type { Chunk } from "./chunk.types.js";

const WINDOW_SECONDS = 45; // group cues within this time window into one chunk

/**
 * Chunks YouTube transcript cues into time-window groups.
 * Identical strategy to VTT chunking — group cues within a 45-second window.
 * Timestamps are stored as seconds (numbers) from the YT parser.
 */
export function chunkYouTube(parsed: ParsedYouTube): Chunk[] {
  const { cues, url, videoId } = parsed;
  if (cues.length === 0) return [];

  const chunks: Chunk[] = [];
  let windowStart = cues[0]!.startTime;
  let currentCues = [cues[0]!];

  for (let i = 1; i < cues.length; i++) {
    const cue = cues[i]!;

    if (cue.startTime - windowStart <= WINDOW_SECONDS) {
      // Still within the window
      currentCues.push(cue);
    } else {
      // Flush current window as a chunk
      chunks.push(buildYTChunk(currentCues, url, videoId));
      windowStart = cue.startTime;
      currentCues = [cue];
    }
  }

  // Flush final window
  if (currentCues.length > 0) {
    chunks.push(buildYTChunk(currentCues, url, videoId));
  }

  return chunks;
}

function buildYTChunk(
  cues: ParsedYouTube["cues"],
  url: string,
  videoId: string
): Chunk {
  const startSec = cues[0]!.startTime;
  const lastCue = cues[cues.length - 1]!;
  const endSec = lastCue.startTime + lastCue.duration;

  return {
    text: cues.map((c) => c.text).join(" "),
    metadata: {
      sourceType: "youtube",
      sourceName: videoId,
      url,
      // Store as "75.4" seconds so UI can deep-link: ?t=75
      startTime: startSec.toFixed(1),
      endTime: endSec.toFixed(1),
    },
  };
}
