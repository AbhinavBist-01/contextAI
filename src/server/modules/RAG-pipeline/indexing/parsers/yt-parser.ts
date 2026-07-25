import { YoutubeTranscript } from "youtube-transcript";

export interface YTCue {
  startTime: number; // seconds
  duration: number;  // seconds
  text: string;
}

export interface ParsedYouTube {
  videoId: string;
  url: string;
  cues: YTCue[];
}

/**
 * Extracts the YouTube video ID from a standard YouTube URL.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
 */
function extractVideoId(url: string): string {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  throw new Error(`Could not extract video ID from URL: ${url}`);
}

/**
 * Fetches the transcript of a YouTube video and returns structured cue objects.
 * @param url - The YouTube video URL
 */
export async function parseYouTube(url: string): Promise<ParsedYouTube> {
  const videoId = extractVideoId(url);

  const rawCues = await YoutubeTranscript.fetchTranscript(videoId);

  const cues: YTCue[] = rawCues.map((cue) => ({
    startTime: cue.offset / 1000, // convert ms → seconds
    duration: cue.duration / 1000,
    text: cue.text.replace(/\n/g, " ").trim(),
  }));

  return { videoId, url, cues };
}
