import { describe, expect, it } from "vitest";
import {
  normalizeWhitespace,
  preprocessText,
  removeBibliographySection,
  removeQuotedText,
  removeSmallMatchesByWordThreshold,
  splitIntoChunks
} from "../src/features/preprocessing/preprocess-text";

describe("preprocessing rules", () => {
  it("normalizes whitespace without changing word order", () => {
    expect(normalizeWhitespace(" First\t\tline \r\n\r\n\r\n Second   line ")).toBe(
      "First line\n\nSecond line"
    );
  });

  it("removes bibliography sections", () => {
    const text = [
      "Main argument stays here.",
      "",
      "Bibliography",
      "Smith, A. Example source."
    ].join("\n");

    expect(removeBibliographySection(text)).toBe("Main argument stays here.\n");
  });

  it("removes references sections", () => {
    const text = ["Body text.", "", "References:", "1. Source"].join("\n");

    expect(normalizeWhitespace(removeBibliographySection(text))).toBe("Body text.");
  });

  it("removes quoted inline and block text", () => {
    const text = [
      'Original claim "quoted evidence" remains.',
      "> block quotation",
      "Final sentence with “curly quote”."
    ].join("\n");

    expect(normalizeWhitespace(removeQuotedText(text))).toBe(
      "Original claim remains.\n\nFinal sentence with ."
    );
  });

  it("removes paragraph segments below the small-match word threshold", () => {
    const text = [
      "short note",
      "",
      "This longer paragraph has enough words to stay.",
      "",
      "tiny"
    ].join("\n");

    expect(normalizeWhitespace(removeSmallMatchesByWordThreshold(text, 4))).toBe(
      "This longer paragraph has enough words to stay."
    );
  });

  it("splits sanitized text into word-bounded chunks", () => {
    expect(splitIntoChunks("one two three four five", 2)).toEqual([
      {
        chunkIndex: 0,
        endChar: 7,
        startChar: 0,
        text: "one two",
        wordCount: 2
      },
      {
        chunkIndex: 1,
        endChar: 18,
        startChar: 8,
        text: "three four",
        wordCount: 2
      },
      {
        chunkIndex: 2,
        endChar: 23,
        startChar: 19,
        text: "five",
        wordCount: 1
      }
    ]);
  });

  it("returns separate original and sanitized counts with rules applied", () => {
    const rawText = [
      "Keep this substantial sentence in the sanitized content.",
      '"remove this quote"',
      "",
      "References",
      "Source material should be excluded."
    ].join("\n");
    const result = preprocessText({
      options: {
        removeBibliography: true,
        removeQuotes: true,
        smallMatchWordThreshold: 3
      },
      rawText
    });

    expect(result.sanitizedText).toBe(
      "Keep this substantial sentence in the sanitized content."
    );
    expect(result.originalWordCount).toBeGreaterThan(result.sanitizedWordCount);
    expect(result.removedWordCount).toBe(
      result.originalWordCount - result.sanitizedWordCount
    );
    expect(result.rulesApplied).toEqual({
      normalizeWhitespace: true,
      removeBibliography: true,
      removeQuotes: true,
      smallMatchWordThreshold: 3
    });
    expect(result.chunks).toHaveLength(1);
  });
});
