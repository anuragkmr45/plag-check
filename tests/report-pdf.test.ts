import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";
import { buildReportJson, type ReportAssemblyInput } from "../src/features/reports/report.service";
import { renderReportPdf } from "../src/features/reports/report-pdf";

const generatedAt = new Date("2026-04-28T00:00:00.000Z");
const createdAt = new Date("2026-04-27T10:00:00.000Z");
const updatedAt = new Date("2026-04-27T11:00:00.000Z");

const reportInput = {
  aiAssessments: [
    {
      explanation: "Synthetic phrasing detected",
      label: "likely_ai",
      probability: 0.82,
      sentenceEndChar: 90,
      sentenceStartChar: 10
    }
  ],
  extraction: {
    charCount: 480,
    createdAt,
    extractionMethod: "text/plain",
    id: "extraction-1",
    wordCount: 80
  },
  files: [
    {
      checksumSha256: "checksum",
      createdAt,
      fileSizeBytes: 1024,
      id: "file-1",
      mimeType: "text/plain",
      originalFilename: "paper.txt",
      uploadedByUserId: "user-1"
    }
  ],
  generatedAt,
  grammarFindings: [
    {
      length: 3,
      message: "Possible typo: teh",
      offset: 42,
      replacementSuggestions: ["the"]
    }
  ],
  preprocessing: {
    createdAt,
    id: "preprocessing-1",
    originalWordCount: 80,
    removedWordCount: 10,
    rulesApplied: {
      normalizeWhitespace: true,
      removeBibliography: true,
      removeQuotes: true,
      smallMatchWordThreshold: 3
    },
    sanitizedWordCount: 70
  },
  review: {
    case: {
      assignedReviewerId: "reviewer-1",
      createdAt,
      finalDecision: null,
      id: "review-case-1",
      status: "OPEN",
      updatedAt
    },
    notes: [
      {
        actorUserId: "reviewer-1",
        comment: "Needs source review",
        createdAt,
        eventType: "NOTE_ADDED",
        id: "review-note-1",
        metadata: {}
      }
    ]
  },
  scan: {
    aiProbability: 0.82,
    createdAt,
    id: "scan-result-1",
    originalWordCount: 80,
    providerMetadata: {
      provider: "mock"
    },
    scannedWordCount: 70,
    scanJobId: "scan-job-1",
    similarityScore: 42
  },
  sourceMatches: [
    {
      endChar: 18,
      matchedText: "Academic integrity",
      similarityScore: 55,
      sourceTitle: "Integrity source",
      sourceUrl: null,
      startChar: 0
    }
  ],
  submission: {
    assignedReviewerId: "reviewer-1",
    createdAt,
    createdByUserId: "user-1",
    id: "submission-1",
    metadata: {},
    status: "SCAN_COMPLETE",
    title: "Final paper",
    updatedAt,
    wordCount: 80
  },
  tenant: {
    branding: {
      logoStorageKey: null,
      logoUrl: null,
      primaryColor: null,
      reportFooter: "Report footer"
    },
    id: "tenant-1",
    name: "Demo Institution"
  }
} satisfies ReportAssemblyInput;

describe("report PDF rendering", () => {
  it("renders a PDF containing the required report sections", async () => {
    const report = buildReportJson(reportInput);
    const pdfBuffer = await renderReportPdf(report);
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText();

    await parser.destroy();

    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(parsed.text).toContain("Demo Institution");
    expect(parsed.text).toContain("Final paper");
    expect(parsed.text).toContain("Visual summary");
    expect(parsed.text).toContain("Copied estimate");
    expect(parsed.text).toContain("Original estimate");
    expect(parsed.text).toContain("Top source match scores");
    expect(parsed.text).toContain("Similarity analysis");
    expect(parsed.text).toContain("Overall similarity score: 42%");
    expect(parsed.text).toContain("AI probability: 82%");
    expect(parsed.text).toContain("Integrity source");
    expect(parsed.text).toContain("Academic integrity");
    expect(parsed.text).toContain("Exclusions summary");
    expect(parsed.text).toContain("Needs source review");
    expect(parsed.text).toContain("Disclaimer");
    expect(parsed.text).toContain("Final academic or administrative action must be based on human review");
  });
});
