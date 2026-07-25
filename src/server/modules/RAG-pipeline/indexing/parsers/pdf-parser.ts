import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;

export interface ParsedPDF {
  text: string;
  totalPages: number;
  fileName: string;
}

/**
 * Parses a PDF file from a given file path and extracts raw text + metadata.
 * @param filePath - Absolute path to the PDF file on disk
 * @param fileName - Original file name for metadata
 */
export async function parsePDF(
  filePath: string,
  fileName: string
): Promise<ParsedPDF> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    totalPages: data.numpages,
    fileName,
  };
}
