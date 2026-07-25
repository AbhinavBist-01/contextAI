export interface VTTCue {
  startTime: string;
  endTime: string;
  text: string;
}

export interface ParsedVTT {
  cues: VTTCue[];
  fileName: string;
}

/**
 * Parses a raw VTT string into structured cue objects with timestamps and text.
 * @param vttContent - Raw string content of the .vtt file
 * @param fileName   - Original file name for metadata
 */
export function parseVTT(vttContent: string, fileName: string): ParsedVTT {
  const lines = vttContent.split(/\r?\n/);
  const cues: VTTCue[] = [];

  let i = 0;

  // Skip the WEBVTT header line
  while (i < lines.length && !lines[i]?.includes("-->")) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i]?.trim();

    // Look for a timestamp line: "00:00:01.000 --> 00:00:04.000"
    if (line && line.includes("-->")) {
      const [startTime, endTime] = line.split("-->").map((t) => t.trim());

      // Collect all text lines until a blank line (end of cue block)
      const textLines: string[] = [];
      i++;

      while (i < lines.length && lines[i]?.trim() !== "") {
        const rawLine = lines[i]?.trim() ?? "";
        // Strip VTT inline tags like <c>, <b>, timestamps e.g. <00:00:01.000>
        const cleaned = rawLine.replace(/<[^>]+>/g, "").trim();
        if (cleaned) textLines.push(cleaned);
        i++;
      }

      if (startTime && endTime && textLines.length > 0) {
        cues.push({
          startTime,
          endTime,
          text: textLines.join(" "),
        });
      }
    } else {
      i++;
    }
  }

  return { cues, fileName };
}
