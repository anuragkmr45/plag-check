import { describe, expect, it } from "vitest";
import {
  buildReportVisualSummary,
  formatAssessmentLabel,
  formatCharacterRange,
  formatExclusionRules,
  formatMetadataEntries,
  formatReplacementSuggestions,
  formatReportProbability,
  formatReportScore,
  formatVisualPercent
} from "../src/features/reports/report-view";

describe("report view helpers", () => {
  it("formats similarity and AI indicators as separate percentages", () => {
    expect(formatReportScore(42.4)).toBe("42%");
    expect(formatReportProbability(0.876)).toBe("88%");
    expect(formatVisualPercent(101)).toBe("100%");
  });

  it("summarizes preprocessing exclusion rules from typed JSON", () => {
    expect(
      formatExclusionRules({
        normalizeWhitespace: true,
        removeBibliography: true,
        removeQuotes: false,
        smallMatchWordThreshold: 14
      })
    ).toEqual([
      "Whitespace normalized",
      "Bibliography and references excluded",
      "Quoted text included",
      "Small matches under 14 words excluded"
    ]);
  });

  it("provides safe empty summaries for unknown exclusion and metadata shapes", () => {
    expect(formatExclusionRules(null)).toEqual([
      "No exclusion rules were recorded."
    ]);
    expect(formatMetadataEntries(null)).toEqual([]);
  });

  it("formats provider metadata and grammar suggestions safely", () => {
    expect(
      formatMetadataEntries({
        algorithmVersion: "mock-v1",
        matchedPhraseCount: 2,
        provider: "mock"
      })
    ).toEqual([
      { label: "Algorithm version", value: "mock-v1" },
      { label: "Matched phrase count", value: "2" },
      { label: "Provider", value: "mock" }
    ]);
    expect(formatReplacementSuggestions([" the ", "", 42])).toBe("the");
    expect(formatReplacementSuggestions({})).toBe("No replacement suggestions");
  });

  it("formats character ranges for source and AI evidence", () => {
    expect(formatCharacterRange(10, 42)).toBe("10-42");
    expect(formatAssessmentLabel("likely_ai")).toBe("Likely AI");
    expect(formatAssessmentLabel("likely_human")).toBe("Likely human");
  });

  it("builds a visual report summary for charts and PDF metrics", () => {
    const summary = buildReportVisualSummary({
      aiProbability: 0.82,
      grammarFindingCount: 2,
      originalWordCount: 100,
      removedWordCount: 20,
      scannedWordCount: 80,
      similarityScore: 42.4,
      sourceMatches: [
        { similarityScore: 44, sourceTitle: "Lower source" },
        { similarityScore: 91, sourceTitle: "Highest source" }
      ]
    });

    expect(formatVisualPercent(summary.similarity.copiedPercent)).toBe("42%");
    expect(formatVisualPercent(summary.similarity.originalPercent)).toBe("58%");
    expect(formatVisualPercent(summary.ai.aiPercent)).toBe("82%");
    expect(formatVisualPercent(summary.preprocessing.excludedPercent)).toBe("20%");
    expect(summary.grammar.densityLabel).toBe(
      "2 findings - 25 per 1,000 scanned words"
    );
    expect(summary.topSources.map((source) => source.label)).toEqual([
      "Highest source",
      "Lower source"
    ]);
  });
});
