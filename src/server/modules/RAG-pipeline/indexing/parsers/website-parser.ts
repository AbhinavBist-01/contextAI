import axios from "axios";
import * as cheerio from "cheerio";

export interface ParsedWebsite {
  title: string;
  url: string;
  sections: WebsiteSection[];
}

export interface WebsiteSection {
  heading: string;
  text: string;
}

/**
 * Fetches a webpage and extracts structured sections based on heading hierarchy.
 * Strips nav, footer, script, and style noise.
 * @param url - The public URL of the webpage to parse
 */
export async function parseWebsite(url: string): Promise<ParsedWebsite> {
  const { data: html } = await axios.get<string>(url, {
    headers: {
      // Mimic a browser to avoid bot-blocking
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    timeout: 10000,
  });

  const $ = cheerio.load(html);

  // Remove noisy elements
  $("script, style, nav, footer, header, aside, noscript, iframe").remove();

  const title = $("title").text().trim() || url;
  const sections: WebsiteSection[] = [];

  // Walk through h1–h3 headings and collect their sibling text until next heading
  $("h1, h2, h3").each((_i, el) => {
    const heading = $(el).text().trim();
    const textParts: string[] = [];

    // Collect all following siblings until the next heading
    let next = $(el).next();
    while (next.length && !next.is("h1, h2, h3")) {
      const text = next.text().trim();
      if (text) textParts.push(text);
      next = next.next();
    }

    const text = textParts.join(" ").replace(/\s+/g, " ").trim();

    if (heading && text) {
      sections.push({ heading, text });
    }
  });

  // Fallback: if no headings found, extract all body paragraphs as one section
  if (sections.length === 0) {
    const bodyText = $("p")
      .map((_i, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join(" ");

    if (bodyText) {
      sections.push({ heading: title, text: bodyText });
    }
  }

  return { title, url, sections };
}
