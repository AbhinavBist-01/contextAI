import fs from "fs";
import { PDFParse } from "pdf-parse";

export interface ParsedPDF {
  text: string;
  totalPages: number;
  fileName: string;
}

/**
 * Parses a PDF file from a given file path and extracts raw text + metadata.
 * Loads all pages into memory before extracting text to ensure full content parsing.
 * @param filePath - Absolute path to the PDF file on disk
 * @param fileName - Original file name for metadata
 */
export async function parsePDF(
  filePath: string,
  fileName: string
): Promise<ParsedPDF> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  
  // Load PDF structure into memory
  await (parser as any).load();

  const info = await parser.getText();
  const totalPages = info.total || 1;

  const pageTexts: string[] = [];

  // Iterate over each page to extract actual textual content
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const pageResult = await (parser as any).getPageText(pageNum);
      const rawText = pageResult?.text?.trim() ?? "";
      // Strip out empty page headers like "-- 1 of 12 --" if no real text
      const cleanText = rawText.replace(/^--\s*\d+\s*of\s*\d+\s*--$/gi, "").trim();
      if (cleanText) {
        pageTexts.push(cleanText);
      }
    } catch (err) {
      console.warn(`[pdf-parser] Warning reading page ${pageNum}:`, err);
    }
  }

  let extractedText = pageTexts.join("\n\n");

  // Fallback if page iteration yielded empty text
  if (!extractedText.trim()) {
    extractedText = (info.text || "")
      .replace(/^(--\s*\d+\s*of\s*\d+\s*--\s*)+$/gi, "")
      .trim();
  }

  await parser.destroy();

  return {
    text: extractedText,
    totalPages,
    fileName,
  };
}
