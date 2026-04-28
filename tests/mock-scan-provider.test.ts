import { describe, expect, it } from "vitest";
import { mockScanProvider } from "../src/features/scanning/providers";

const scanInput = {
  originalWordCount: 28,
  scanMode: "standard",
  scannedWordCount: 24,
  submissionId: "00000000-0000-4000-8000-000000000001",
  tenantId: "00000000-0000-4000-8000-000000000002",
  text: [
    "Academic integrity matters in plagiarism detection.",
    "As an AI language model, this sentence uses a mock indicator.",
    "This line has teh typo and  repeated spacing."
  ].join(" ")
} as const;

describe("mock scan provider", () => {
  it("returns deterministic scan results for the same input", async () => {
    const first = await mockScanProvider.scan(scanInput);
    const second = await mockScanProvider.scan(scanInput);

    expect(second).toEqual(first);
  });

  it("returns similarity, AI, source, and grammar findings", async () => {
    const result = await mockScanProvider.scan(scanInput);

    expect(result.similarityScore).toBeGreaterThan(0);
    expect(result.aiProbability).toBeGreaterThan(0.5);
    expect(result.sourceMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchedText: "Academic integrity",
          sourceTitle: "Academic Integrity Guide"
        }),
        expect.objectContaining({
          matchedText: "plagiarism detection",
          sourceTitle: "Similarity Detection Notes"
        })
      ])
    );
    expect(result.aiAssessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "likely_ai"
        })
      ])
    );
    expect(result.grammarFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Possible typo: teh",
          replacementSuggestions: ["the"]
        }),
        expect.objectContaining({
          message: "Repeated whitespace"
        })
      ])
    );
    expect(result.providerMetadata).toMatchObject({
      algorithmVersion: "mock-v1",
      provider: "mock"
    });
  });

  it("keeps empty or unmatched text within score bounds", async () => {
    const result = await mockScanProvider.scan({
      ...scanInput,
      text: "Short original text."
    });

    expect(result.similarityScore).toBeGreaterThanOrEqual(0);
    expect(result.similarityScore).toBeLessThanOrEqual(100);
    expect(result.aiProbability).toBeGreaterThanOrEqual(0);
    expect(result.aiProbability).toBeLessThanOrEqual(1);
    expect(result.sourceMatches).toHaveLength(0);
  });
});
