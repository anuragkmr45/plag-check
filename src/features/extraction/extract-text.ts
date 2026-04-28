import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractionMethod = "docx" | "pdf" | "txt";

export type ExtractTextResult = {
  charCount: number;
  extractionMethod: ExtractionMethod;
  rawText: string;
  wordCount: number;
};

export type ExtractTextFromFileInput = {
  buffer: Buffer;
  filename?: string;
  mimeType?: string;
};

export class UnsupportedExtractionTypeError extends Error {
  readonly code = "UNSUPPORTED_EXTRACTION_TYPE";

  constructor(message = "Unsupported file type for extraction") {
    super(message);
    this.name = "UnsupportedExtractionTypeError";
  }
}

export function extractTextFromTxt(buffer: Buffer): ExtractTextResult {
  return buildExtractionResult(stripUtf8Bom(buffer.toString("utf8")), "txt");
}

export async function extractTextFromDocx(
  buffer: Buffer
): Promise<ExtractTextResult> {
  const result = await mammoth.extractRawText({ buffer });

  return buildExtractionResult(result.value, "docx");
}

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<ExtractTextResult> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return buildExtractionResult(result.text, "pdf");
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromFile(
  input: ExtractTextFromFileInput
): Promise<ExtractTextResult> {
  const fileType = resolveExtractionFileType(input);

  if (fileType === "txt") {
    return extractTextFromTxt(input.buffer);
  }

  if (fileType === "docx") {
    return extractTextFromDocx(input.buffer);
  }

  if (fileType === "pdf") {
    return extractTextFromPdf(input.buffer);
  }

  throw new UnsupportedExtractionTypeError();
}

export function countWords(text: string): number {
  return text.trim().match(/\S+/gu)?.length ?? 0;
}

function buildExtractionResult(
  text: string,
  extractionMethod: ExtractionMethod
): ExtractTextResult {
  const rawText = normalizeExtractedText(text);

  return {
    charCount: Array.from(rawText).length,
    extractionMethod,
    rawText,
    wordCount: countWords(rawText)
  };
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

function resolveExtractionFileType(
  input: ExtractTextFromFileInput
): ExtractionMethod | null {
  const mimeType = input.mimeType?.split(";")[0]?.trim().toLowerCase();
  const filename = input.filename?.trim().toLowerCase();

  if (mimeType === "text/plain" || filename?.endsWith(".txt")) {
    return "txt";
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename?.endsWith(".docx")
  ) {
    return "docx";
  }

  if (mimeType === "application/pdf" || filename?.endsWith(".pdf")) {
    return "pdf";
  }

  return null;
}

function stripUtf8Bom(text: string): string {
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}
