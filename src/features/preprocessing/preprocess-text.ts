export type PreprocessOptions = {
  removeBibliography: boolean;
  removeQuotes: boolean;
  smallMatchWordThreshold?: number;
};

export type PreprocessTextInput = {
  options: PreprocessOptions;
  rawText: string;
};

export type PreprocessRulesApplied = {
  normalizeWhitespace: true;
  removeBibliography: boolean;
  removeQuotes: boolean;
  smallMatchWordThreshold: number | null;
};

export type TextChunk = {
  chunkIndex: number;
  endChar: number;
  startChar: number;
  text: string;
  wordCount: number;
};

export type PreprocessTextResult = {
  chunks: TextChunk[];
  originalWordCount: number;
  removedWordCount: number;
  rulesApplied: PreprocessRulesApplied;
  sanitizedText: string;
  sanitizedWordCount: number;
};

const defaultChunkWordSize = 200;

export const DEFAULT_PREPROCESS_OPTIONS = {
  removeBibliography: true,
  removeQuotes: true,
  smallMatchWordThreshold: 14
} as const satisfies PreprocessOptions;

export function preprocessText(input: PreprocessTextInput): PreprocessTextResult {
  const normalizedOriginal = normalizeWhitespace(input.rawText);
  const originalWordCount = countWords(normalizedOriginal);
  const threshold = normalizeSmallMatchThreshold(
    input.options.smallMatchWordThreshold
  );
  let sanitizedText = normalizedOriginal;

  if (input.options.removeQuotes) {
    sanitizedText = removeQuotedText(sanitizedText);
  }

  if (input.options.removeBibliography) {
    sanitizedText = removeBibliographySection(sanitizedText);
  }

  if (threshold !== null) {
    sanitizedText = removeSmallMatchesByWordThreshold(sanitizedText, threshold);
  }

  sanitizedText = normalizeWhitespace(sanitizedText);

  const sanitizedWordCount = countWords(sanitizedText);

  return {
    chunks: splitIntoChunks(sanitizedText),
    originalWordCount,
    removedWordCount: Math.max(0, originalWordCount - sanitizedWordCount),
    rulesApplied: {
      normalizeWhitespace: true,
      removeBibliography: input.options.removeBibliography,
      removeQuotes: input.options.removeQuotes,
      smallMatchWordThreshold: threshold
    },
    sanitizedText,
    sanitizedWordCount
  };
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function removeBibliographySection(text: string): string {
  const bibliographyHeading = /^\s*(references|bibliography|works cited|literature cited)\s*:?$/gim;
  const match = bibliographyHeading.exec(text);

  if (!match) {
    return text;
  }

  return text.slice(0, match.index);
}

export function removeQuotedText(text: string): string {
  return text
    .replace(/"[^"\n]*"/g, " ")
    .replace(/“[^”\n]*”/g, " ")
    .replace(/^\s*>.*$/gm, " ");
}

export function removeSmallMatchesByWordThreshold(
  text: string,
  threshold: number
): string {
  const normalizedThreshold = normalizeSmallMatchThreshold(threshold);

  if (normalizedThreshold === null) {
    return text;
  }

  return text
    .split(/\n{2,}/)
    .filter((segment) => countWords(segment) >= normalizedThreshold)
    .join("\n\n");
}

export function splitIntoChunks(
  text: string,
  maxWordsPerChunk = defaultChunkWordSize
): TextChunk[] {
  const normalizedMaxWords = Math.max(1, Math.floor(maxWordsPerChunk));
  const words = Array.from(text.matchAll(/\S+/gu)).map((match) => ({
    endChar: match.index + match[0].length,
    startChar: match.index,
    text: match[0]
  }));
  const chunks: TextChunk[] = [];

  for (let index = 0; index < words.length; index += normalizedMaxWords) {
    const chunkWords = words.slice(index, index + normalizedMaxWords);
    const firstWord = chunkWords[0];
    const lastWord = chunkWords.at(-1);

    if (!firstWord || !lastWord) {
      continue;
    }

    chunks.push({
      chunkIndex: chunks.length,
      endChar: lastWord.endChar,
      startChar: firstWord.startChar,
      text: text.slice(firstWord.startChar, lastWord.endChar),
      wordCount: chunkWords.length
    });
  }

  return chunks;
}

export function countWords(text: string): number {
  return text.trim().match(/\S+/gu)?.length ?? 0;
}

function normalizeSmallMatchThreshold(threshold: number | undefined): number | null {
  if (!threshold || threshold <= 1) {
    return null;
  }

  return Math.floor(threshold);
}
