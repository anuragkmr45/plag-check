import { describe, expect, it } from "vitest";
import {
  STANDARD_REPORT_DISCLAIMER,
  buildReportJson,
  resolveTenantBranding,
  type ReportAssemblyInput
} from "../src/features/reports/report.service";

const generatedAt = new Date("2026-04-28T00:00:00.000Z");
const createdAt = new Date("2026-04-27T10:00:00.000Z");
const updatedAt = new Date("2026-04-27T11:00:00.000Z");

const baseInput = {
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
      removeBibliography: true,
      removeQuotes: true
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
        metadata: {
          visibility: "internal"
        }
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
    metadata: {
      course: "ENG101"
    },
    status: "SCAN_COMPLETE",
    title: "Final paper",
    updatedAt,
    wordCount: 80
  },
  tenant: {
    branding: {
      logoStorageKey: "tenant-assets/logo.png",
      logoUrl: "https://example.test/logo.png",
      primaryColor: "#1f2937",
      reportFooter: "Demo footer"
    },
    id: "tenant-1",
    name: "Demo Institution"
  }
} satisfies ReportAssemblyInput;

describe("report assembly service", () => {
  it("assembles complete typed report JSON with separated similarity and AI sections", () => {
    const report = buildReportJson(baseInput);

    expect(report.disclaimer).toBe(STANDARD_REPORT_DISCLAIMER);
    expect(report.generatedAt).toBe("2026-04-28T00:00:00.000Z");
    expect(report.tenant).toEqual(baseInput.tenant);
    expect(report.submission).toMatchObject({
      id: "submission-1",
      status: "SCAN_COMPLETE",
      title: "Final paper"
    });
    expect(report.files).toEqual([
      expect.objectContaining({
        createdAt: "2026-04-27T10:00:00.000Z",
        originalFilename: "paper.txt"
      })
    ]);
    expect(report.scan.similarityScore).toBe(42);
    expect(report.scan.aiProbability).toBe(0.82);
    expect(report.scan.sourceMatches).toHaveLength(1);
    expect(report.scan.aiAssessments).toHaveLength(1);
    expect(report.scan.grammarFindings).toHaveLength(1);
    expect(report.review.notes).toEqual([
      expect.objectContaining({
        comment: "Needs source review",
        eventType: "NOTE_ADDED"
      })
    ]);
  });

  it("keeps optional extraction, preprocessing, and review data nullable", () => {
    const report = buildReportJson({
      ...baseInput,
      extraction: null,
      preprocessing: null,
      review: {
        case: null,
        notes: []
      }
    });

    expect(report.extraction).toBeNull();
    expect(report.preprocessing).toBeNull();
    expect(report.review).toEqual({
      case: null,
      notes: []
    });
  });

  it("resolves tenant branding from nested or flat settings with safe null defaults", () => {
    expect(
      resolveTenantBranding({
        branding: {
          logoStorageKey: "tenant-assets/logo.png",
          logoUrl: "https://example.test/logo.png",
          primaryColor: "#111827",
          reportFooter: "Footer"
        }
      })
    ).toEqual({
      logoStorageKey: "tenant-assets/logo.png",
      logoUrl: "https://example.test/logo.png",
      primaryColor: "#111827",
      reportFooter: "Footer"
    });

    expect(
      resolveTenantBranding({
        logoUrl: "https://example.test/flat-logo.png"
      })
    ).toEqual({
      logoStorageKey: null,
      logoUrl: "https://example.test/flat-logo.png",
      primaryColor: null,
      reportFooter: null
    });

    expect(resolveTenantBranding(null)).toEqual({
      logoStorageKey: null,
      logoUrl: null,
      primaryColor: null,
      reportFooter: null
    });
  });
});
