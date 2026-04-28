import { and, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import type { RbacUser } from "../../lib/rbac/guards";
import {
  getSubmissionDetailById,
  type SubmissionDetail,
  type SubmissionStatus
} from "../../server/services/submissions.service";

export const STANDARD_REPORT_DISCLAIMER =
  "Similarity and AI scores are indicators only. Final academic or administrative action must be based on human review and institutional policy.";
export const DEMO_REAL_REPORT_DISCLAIMER =
  "Demo Real uses Tavily, Gemini, OpenAlex, and LanguageTool/free APIs. Results are for demonstration and review support only, not certified plagiarism proof.";

export type ReportJson = {
  disclaimer: string;
  extraction: ReportExtractionSummary | null;
  files: ReportFileMetadata[];
  generatedAt: string;
  preprocessing: ReportPreprocessingSummary | null;
  review: {
    case: ReportReviewCase | null;
    notes: ReportReviewNote[];
  };
  scan: ReportScanSection;
  submission: ReportSubmissionMetadata;
  tenant: ReportTenantMetadata;
};

export type ReportTenantMetadata = {
  branding: {
    logoStorageKey: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    reportFooter: string | null;
  };
  id: string;
  name: string;
};

export type ReportSubmissionMetadata = {
  assignedReviewerId: string | null;
  createdAt: string;
  createdByUserId: string;
  id: string;
  metadata: unknown;
  status: SubmissionStatus;
  title: string;
  updatedAt: string;
  wordCount: number | null;
};

export type ReportFileMetadata = {
  checksumSha256: string;
  createdAt: string;
  fileSizeBytes: number;
  id: string;
  mimeType: string;
  originalFilename: string;
  uploadedByUserId: string;
};

export type ReportExtractionSummary = {
  charCount: number;
  createdAt: string;
  extractionMethod: string;
  id: string;
  wordCount: number;
};

export type ReportPreprocessingSummary = {
  createdAt: string;
  id: string;
  originalWordCount: number;
  removedWordCount: number;
  rulesApplied: unknown;
  sanitizedWordCount: number;
};

export type ReportScanSection = {
  aiAssessments: ReportAiAssessment[];
  aiProbability: number;
  createdAt: string;
  grammarFindings: ReportGrammarFinding[];
  id: string;
  originalWordCount: number;
  providerMetadata: unknown;
  scannedWordCount: number;
  scanJobId: string;
  similarityScore: number;
  sourceMatches: ReportSourceMatch[];
};

export type ReportSourceMatch = {
  endChar: number;
  matchedText: string;
  similarityScore: number;
  sourceTitle: string;
  sourceUrl: string | null;
  startChar: number;
};

export type ReportAiAssessment = {
  explanation: string | null;
  label: string;
  probability: number;
  sentenceEndChar: number;
  sentenceStartChar: number;
};

export type ReportGrammarFinding = {
  length: number;
  message: string;
  offset: number;
  replacementSuggestions: unknown;
};

export type ReportReviewCase = {
  assignedReviewerId: string | null;
  createdAt: string;
  finalDecision: string | null;
  id: string;
  status: string;
  updatedAt: string;
};

export type ReportReviewNote = {
  actorUserId: string | null;
  comment: string;
  createdAt: string;
  eventType: string;
  id: string;
  metadata: unknown;
};

export type ReportAssemblyInput = {
  aiAssessments: Array<Omit<ReportAiAssessment, never>>;
  extraction: (Omit<ReportExtractionSummary, "createdAt"> & { createdAt: Date }) | null;
  files: Array<Omit<ReportFileMetadata, "createdAt"> & { createdAt: Date }>;
  generatedAt?: Date;
  grammarFindings: Array<Omit<ReportGrammarFinding, never>>;
  preprocessing:
    | (Omit<ReportPreprocessingSummary, "createdAt"> & { createdAt: Date })
    | null;
  review: {
    case:
      | (Omit<ReportReviewCase, "createdAt" | "updatedAt"> & {
          createdAt: Date;
          updatedAt: Date;
        })
      | null;
    notes: Array<Omit<ReportReviewNote, "createdAt"> & { createdAt: Date }>;
  };
  scan: Omit<ReportScanSection, "aiAssessments" | "createdAt" | "grammarFindings" | "sourceMatches"> & {
    createdAt: Date;
  };
  sourceMatches: Array<Omit<ReportSourceMatch, never>>;
  submission: Omit<ReportSubmissionMetadata, "createdAt" | "updatedAt"> & {
    createdAt: Date;
    updatedAt: Date;
  };
  tenant: ReportTenantMetadata;
};

type ReportServiceOptions = {
  database?: Database;
  generatedAt?: Date;
};

const tenantBrandingSettingsSchema = z
  .object({
    branding: z
      .object({
        logoStorageKey: z.string().trim().min(1).nullable().optional(),
        logoUrl: z.string().trim().min(1).nullable().optional(),
        primaryColor: z.string().trim().min(1).nullable().optional(),
        reportFooter: z.string().trim().min(1).nullable().optional()
      })
      .optional(),
    logoStorageKey: z.string().trim().min(1).nullable().optional(),
    logoUrl: z.string().trim().min(1).nullable().optional(),
    primaryColor: z.string().trim().min(1).nullable().optional(),
    reportFooter: z.string().trim().min(1).nullable().optional()
  })
  .passthrough();

export async function getReportJsonForSubmission(
  user: RbacUser,
  submissionId: string,
  options: ReportServiceOptions = {}
): Promise<ReportJson | null> {
  const db = options.database ?? getDatabase();
  const detail = await getSubmissionDetailById(user, submissionId, {
    database: db
  });

  if (!detail) {
    return null;
  }

  const [tenant, extraction, preprocessing, scan] = await Promise.all([
    getTenantMetadata(db, detail.submission.tenantId),
    getLatestExtraction(db, detail),
    getLatestPreprocessing(db, detail),
    getLatestScanSection(db, detail)
  ]);

  if (!tenant || !scan) {
    return null;
  }

  const [sourceMatches, aiAssessments, grammarFindings, review] =
    await Promise.all([
      getSourceMatches(db, detail.submission.tenantId, scan.id),
      getAiAssessments(db, detail.submission.tenantId, scan.id),
      getGrammarFindings(db, detail.submission.tenantId, scan.id),
      getReviewSection(db, detail)
    ]);

  return buildReportJson({
    aiAssessments,
    extraction,
    files: detail.files.map((file) => ({
      checksumSha256: file.checksumSha256,
      createdAt: file.createdAt,
      fileSizeBytes: file.fileSizeBytes,
      id: file.id,
      mimeType: file.mimeType,
      originalFilename: file.originalFilename,
      uploadedByUserId: file.uploadedByUserId
    })),
    generatedAt: options.generatedAt,
    grammarFindings,
    preprocessing,
    review,
    scan,
    sourceMatches,
    submission: {
      assignedReviewerId: detail.submission.assignedReviewerId,
      createdAt: detail.submission.createdAt,
      createdByUserId: detail.submission.createdByUserId,
      id: detail.submission.id,
      metadata: detail.submission.metadata,
      status: detail.submission.status,
      title: detail.submission.title,
      updatedAt: detail.submission.updatedAt,
      wordCount: detail.submission.wordCount
    },
    tenant
  });
}

export function buildReportJson(input: ReportAssemblyInput): ReportJson {
  return {
    disclaimer: resolveReportDisclaimer(input.scan.providerMetadata),
    extraction: input.extraction
      ? {
          ...input.extraction,
          createdAt: input.extraction.createdAt.toISOString()
        }
      : null,
    files: input.files.map((file) => ({
      ...file,
      createdAt: file.createdAt.toISOString()
    })),
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    preprocessing: input.preprocessing
      ? {
          ...input.preprocessing,
          createdAt: input.preprocessing.createdAt.toISOString()
        }
      : null,
    review: {
      case: input.review.case
        ? {
            ...input.review.case,
            createdAt: input.review.case.createdAt.toISOString(),
            updatedAt: input.review.case.updatedAt.toISOString()
          }
        : null,
      notes: input.review.notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString()
      }))
    },
    scan: {
      ...input.scan,
      aiAssessments: input.aiAssessments,
      createdAt: input.scan.createdAt.toISOString(),
      grammarFindings: input.grammarFindings,
      sourceMatches: input.sourceMatches
    },
    submission: {
      ...input.submission,
      createdAt: input.submission.createdAt.toISOString(),
      updatedAt: input.submission.updatedAt.toISOString()
    },
    tenant: input.tenant
  };
}

function resolveReportDisclaimer(providerMetadata: unknown): string {
  if (
    typeof providerMetadata === "object" &&
    providerMetadata !== null &&
    !Array.isArray(providerMetadata) &&
    providerMetadata &&
    "provider" in providerMetadata &&
    providerMetadata.provider === "demo-real"
  ) {
    return DEMO_REAL_REPORT_DISCLAIMER;
  }

  return STANDARD_REPORT_DISCLAIMER;
}

export function resolveTenantBranding(settings: unknown): ReportTenantMetadata["branding"] {
  const parsedSettings = tenantBrandingSettingsSchema.safeParse(settings);

  if (!parsedSettings.success) {
    return {
      logoStorageKey: null,
      logoUrl: null,
      primaryColor: null,
      reportFooter: null
    };
  }

  const branding = parsedSettings.data.branding ?? parsedSettings.data;

  return {
    logoStorageKey: branding.logoStorageKey ?? null,
    logoUrl: branding.logoUrl ?? null,
    primaryColor: branding.primaryColor ?? null,
    reportFooter: branding.reportFooter ?? null
  };
}

async function getTenantMetadata(
  db: Database,
  tenantId: string
): Promise<ReportTenantMetadata | null> {
  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return null;
  }

  const [settings] = await db
    .select({
      settings: schema.tenantSettings.settings
    })
    .from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenantId))
    .limit(1);

  return {
    branding: resolveTenantBranding(settings?.settings),
    id: tenant.id,
    name: tenant.name
  };
}

async function getLatestExtraction(
  db: Database,
  detail: SubmissionDetail
): Promise<ReportAssemblyInput["extraction"]> {
  const [extraction] = await db
    .select({
      charCount: schema.extractedTexts.charCount,
      createdAt: schema.extractedTexts.createdAt,
      extractionMethod: schema.extractedTexts.extractionMethod,
      id: schema.extractedTexts.id,
      wordCount: schema.extractedTexts.wordCount
    })
    .from(schema.extractedTexts)
    .where(
      and(
        eq(schema.extractedTexts.tenantId, detail.submission.tenantId),
        eq(schema.extractedTexts.submissionId, detail.submission.id)
      )
    )
    .orderBy(desc(schema.extractedTexts.createdAt))
    .limit(1);

  return extraction ?? null;
}

async function getLatestPreprocessing(
  db: Database,
  detail: SubmissionDetail
): Promise<ReportAssemblyInput["preprocessing"]> {
  const [preprocessing] = await db
    .select({
      createdAt: schema.preprocessingRuns.createdAt,
      id: schema.preprocessingRuns.id,
      originalWordCount: schema.preprocessingRuns.originalWordCount,
      removedWordCount: schema.preprocessingRuns.removedWordCount,
      rulesApplied: schema.preprocessingRuns.rulesApplied,
      sanitizedWordCount: schema.preprocessingRuns.sanitizedWordCount
    })
    .from(schema.preprocessingRuns)
    .where(
      and(
        eq(schema.preprocessingRuns.tenantId, detail.submission.tenantId),
        eq(schema.preprocessingRuns.submissionId, detail.submission.id)
      )
    )
    .orderBy(desc(schema.preprocessingRuns.createdAt))
    .limit(1);

  return preprocessing ?? null;
}

async function getLatestScanSection(
  db: Database,
  detail: SubmissionDetail
): Promise<ReportAssemblyInput["scan"] | null> {
  const [scan] = await db
    .select({
      aiProbability: schema.scanResults.aiProbability,
      createdAt: schema.scanResults.createdAt,
      id: schema.scanResults.id,
      originalWordCount: schema.scanResults.originalWordCount,
      providerMetadata: schema.scanResults.providerMetadata,
      scannedWordCount: schema.scanResults.scannedWordCount,
      scanJobId: schema.scanResults.scanJobId,
      similarityScore: schema.scanResults.similarityScore
    })
    .from(schema.scanResults)
    .where(
      and(
        eq(schema.scanResults.tenantId, detail.submission.tenantId),
        eq(schema.scanResults.submissionId, detail.submission.id)
      )
    )
    .orderBy(desc(schema.scanResults.createdAt))
    .limit(1);

  return scan ?? null;
}

async function getSourceMatches(
  db: Database,
  tenantId: string,
  scanResultId: string
): Promise<ReportSourceMatch[]> {
  return db
    .select({
      endChar: schema.sourceMatches.endChar,
      matchedText: schema.sourceMatches.matchedText,
      similarityScore: schema.sourceMatches.similarityScore,
      sourceTitle: schema.sourceMatches.sourceTitle,
      sourceUrl: schema.sourceMatches.sourceUrl,
      startChar: schema.sourceMatches.startChar
    })
    .from(schema.sourceMatches)
    .where(
      and(
        eq(schema.sourceMatches.tenantId, tenantId),
        eq(schema.sourceMatches.scanResultId, scanResultId)
      )
    )
    .orderBy(schema.sourceMatches.startChar);
}

async function getAiAssessments(
  db: Database,
  tenantId: string,
  scanResultId: string
): Promise<ReportAiAssessment[]> {
  return db
    .select({
      explanation: schema.aiAssessments.explanation,
      label: schema.aiAssessments.label,
      probability: schema.aiAssessments.probability,
      sentenceEndChar: schema.aiAssessments.sentenceEndChar,
      sentenceStartChar: schema.aiAssessments.sentenceStartChar
    })
    .from(schema.aiAssessments)
    .where(
      and(
        eq(schema.aiAssessments.tenantId, tenantId),
        eq(schema.aiAssessments.scanResultId, scanResultId)
      )
    )
    .orderBy(schema.aiAssessments.sentenceStartChar);
}

async function getGrammarFindings(
  db: Database,
  tenantId: string,
  scanResultId: string
): Promise<ReportGrammarFinding[]> {
  return db
    .select({
      length: schema.grammarFindings.length,
      message: schema.grammarFindings.message,
      offset: schema.grammarFindings.offset,
      replacementSuggestions: schema.grammarFindings.replacementSuggestions
    })
    .from(schema.grammarFindings)
    .where(
      and(
        eq(schema.grammarFindings.tenantId, tenantId),
        eq(schema.grammarFindings.scanResultId, scanResultId)
      )
    )
    .orderBy(schema.grammarFindings.offset);
}

async function getReviewSection(
  db: Database,
  detail: SubmissionDetail
): Promise<ReportAssemblyInput["review"]> {
  const [reviewCase] = await db
    .select({
      assignedReviewerId: schema.reviewCases.assignedReviewerId,
      createdAt: schema.reviewCases.createdAt,
      finalDecision: schema.reviewCases.finalDecision,
      id: schema.reviewCases.id,
      status: schema.reviewCases.status,
      updatedAt: schema.reviewCases.updatedAt
    })
    .from(schema.reviewCases)
    .where(
      and(
        eq(schema.reviewCases.tenantId, detail.submission.tenantId),
        eq(schema.reviewCases.submissionId, detail.submission.id)
      )
    )
    .orderBy(desc(schema.reviewCases.createdAt))
    .limit(1);

  if (!reviewCase) {
    return {
      case: null,
      notes: []
    };
  }

  const notes = await db
    .select({
      actorUserId: schema.reviewEvents.actorUserId,
      comment: schema.reviewEvents.comment,
      createdAt: schema.reviewEvents.createdAt,
      eventType: schema.reviewEvents.eventType,
      id: schema.reviewEvents.id,
      metadata: schema.reviewEvents.metadata
    })
    .from(schema.reviewEvents)
    .where(
      and(
        eq(schema.reviewEvents.tenantId, detail.submission.tenantId),
        eq(schema.reviewEvents.reviewCaseId, reviewCase.id),
        isNotNull(schema.reviewEvents.comment)
      )
    )
    .orderBy(schema.reviewEvents.createdAt);

  return {
    case: reviewCase,
    notes: notes.map((note) => ({
      ...note,
      comment: note.comment ?? ""
    }))
  };
}
