import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  DEFAULT_PREPROCESS_OPTIONS,
  preprocessText,
  type PreprocessOptions,
  type PreprocessRulesApplied
} from "../../features/preprocessing/preprocess-text";
import { getDatabase, schema, type Database } from "../../lib/db";
import { getSubmissionById, type SubmissionSummary } from "./submissions.service";
import type { RbacUser } from "../../lib/rbac/guards";

type SubmissionStatus = (typeof schema.submissionStatus.enumValues)[number];

export type PreprocessingSummary = {
  chunkCount: number;
  createdAt: Date;
  id: string;
  originalWordCount: number;
  removedWordCount: number;
  rulesApplied: PreprocessRulesApplied;
  sanitizedWordCount: number;
};

export type PreprocessSubmissionResult = {
  preprocessingRun: PreprocessingSummary;
  submission: {
    id: string;
    status: SubmissionStatus;
  };
};

type PreprocessingOptions = {
  database?: Database;
};

type ExtractedTextForPreprocessing = {
  rawText: string;
  wordCount: number;
};

const preprocessSettingsSchema = z
  .object({
    removeBibliography: z.boolean().optional(),
    removeQuotes: z.boolean().optional(),
    smallMatchWordThreshold: z.number().int().positive().optional()
  })
  .passthrough();

const tenantSettingsSchema = z
  .object({
    limits: z
      .object({
        smallMatchWordThreshold: z.number().int().positive().optional()
      })
      .optional(),
    preprocessing: preprocessSettingsSchema.optional(),
    removeBibliography: z.boolean().optional(),
    removeQuotes: z.boolean().optional(),
    smallMatchWordThreshold: z.number().int().positive().optional()
  })
  .passthrough();

export class PreprocessingStateError extends Error {
  readonly code = "PREPROCESSING_STATE_ERROR";

  constructor(message = "Submission is not ready for preprocessing") {
    super(message);
    this.name = "PreprocessingStateError";
  }
}

export class PreprocessingSourceMissingError extends Error {
  readonly code = "PREPROCESSING_SOURCE_MISSING";

  constructor(message = "Extracted text is missing") {
    super(message);
    this.name = "PreprocessingSourceMissingError";
  }
}

export class SubmissionPreprocessingNotFoundError extends Error {
  readonly code = "SUBMISSION_PREPROCESSING_NOT_FOUND";

  constructor(message = "Submission not found") {
    super(message);
    this.name = "SubmissionPreprocessingNotFoundError";
  }
}

export function isSubmissionReadyForPreprocessing(
  submission: Pick<SubmissionSummary, "status">
): boolean {
  return submission.status === "READY_FOR_SCAN";
}

export function resolvePreprocessOptions(settings: unknown): PreprocessOptions {
  const parsedSettings = tenantSettingsSchema.safeParse(settings);

  if (!parsedSettings.success) {
    return DEFAULT_PREPROCESS_OPTIONS;
  }

  const settingsData = parsedSettings.data;
  const preprocessingSettings = settingsData.preprocessing ?? settingsData;
  const smallMatchSettings =
    settingsData.preprocessing ?? settingsData.limits ?? settingsData;

  return {
    removeBibliography:
      preprocessingSettings.removeBibliography ??
      DEFAULT_PREPROCESS_OPTIONS.removeBibliography,
    removeQuotes:
      preprocessingSettings.removeQuotes ?? DEFAULT_PREPROCESS_OPTIONS.removeQuotes,
    smallMatchWordThreshold:
      smallMatchSettings.smallMatchWordThreshold ??
      DEFAULT_PREPROCESS_OPTIONS.smallMatchWordThreshold
  };
}

export async function preprocessSubmissionText(
  user: RbacUser,
  submissionId: string,
  options?: PreprocessingOptions
): Promise<PreprocessSubmissionResult> {
  const db = options?.database ?? getDatabase();
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    throw new SubmissionPreprocessingNotFoundError();
  }

  if (!isSubmissionReadyForPreprocessing(submission)) {
    throw new PreprocessingStateError();
  }

  const extractedText = await getLatestExtractedText(db, submission);

  if (!extractedText) {
    throw new PreprocessingSourceMissingError();
  }

  const preprocessOptions = await getTenantPreprocessOptions(db, submission.tenantId);
  const result = preprocessText({
    options: preprocessOptions,
    rawText: extractedText.rawText
  });

  return db.transaction(async (tx) => {
    const [preprocessingRun] = await tx
      .insert(schema.preprocessingRuns)
      .values({
        originalWordCount: result.originalWordCount,
        removedWordCount: result.removedWordCount,
        rulesApplied: result.rulesApplied,
        sanitizedText: result.sanitizedText,
        sanitizedWordCount: result.sanitizedWordCount,
        submissionId: submission.id,
        tenantId: submission.tenantId
      })
      .returning({
        createdAt: schema.preprocessingRuns.createdAt,
        id: schema.preprocessingRuns.id,
        originalWordCount: schema.preprocessingRuns.originalWordCount,
        removedWordCount: schema.preprocessingRuns.removedWordCount,
        rulesApplied: schema.preprocessingRuns.rulesApplied,
        sanitizedWordCount: schema.preprocessingRuns.sanitizedWordCount
      });

    await tx
      .delete(schema.textChunks)
      .where(
        and(
          eq(schema.textChunks.tenantId, submission.tenantId),
          eq(schema.textChunks.submissionId, submission.id)
        )
      );

    if (result.chunks.length > 0) {
      await tx.insert(schema.textChunks).values(
        result.chunks.map((chunk) => ({
          chunkIndex: chunk.chunkIndex,
          endChar: chunk.endChar,
          startChar: chunk.startChar,
          submissionId: submission.id,
          tenantId: submission.tenantId,
          text: chunk.text,
          wordCount: chunk.wordCount
        }))
      );
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.preprocess",
      actorUserId: user.id,
      entityId: preprocessingRun.id,
      entityType: "preprocessing_run",
      metadata: {
        chunkCount: result.chunks.length,
        originalWordCount: result.originalWordCount,
        removedWordCount: result.removedWordCount,
        rulesApplied: result.rulesApplied,
        sanitizedWordCount: result.sanitizedWordCount,
        submissionId: submission.id
      },
      tenantId: submission.tenantId
    });

    return {
      preprocessingRun: {
        ...preprocessingRun,
        chunkCount: result.chunks.length,
        rulesApplied: preprocessingRun.rulesApplied as PreprocessRulesApplied
      },
      submission: {
        id: submission.id,
        status: submission.status
      }
    };
  });
}

export async function getPreprocessingSummaryForSubmission(
  user: RbacUser,
  submissionId: string,
  options?: PreprocessingOptions
): Promise<PreprocessingSummary | null> {
  const db = options?.database ?? getDatabase();
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    return null;
  }

  return getLatestPreprocessingSummary(db, submission);
}

async function getLatestExtractedText(
  db: Database,
  submission: Pick<SubmissionSummary, "id" | "tenantId">
): Promise<ExtractedTextForPreprocessing | null> {
  const [extractedText] = await db
    .select({
      rawText: schema.extractedTexts.rawText,
      wordCount: schema.extractedTexts.wordCount
    })
    .from(schema.extractedTexts)
    .where(
      and(
        eq(schema.extractedTexts.tenantId, submission.tenantId),
        eq(schema.extractedTexts.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.extractedTexts.createdAt))
    .limit(1);

  return extractedText ?? null;
}

async function getLatestPreprocessingSummary(
  db: Database,
  submission: Pick<SubmissionSummary, "id" | "tenantId">
): Promise<PreprocessingSummary | null> {
  const [preprocessingRun] = await db
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
        eq(schema.preprocessingRuns.tenantId, submission.tenantId),
        eq(schema.preprocessingRuns.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.preprocessingRuns.createdAt))
    .limit(1);

  if (!preprocessingRun) {
    return null;
  }

  const [chunkCountRow] = await db
    .select({
      chunkCount: count()
    })
    .from(schema.textChunks)
    .where(
      and(
        eq(schema.textChunks.tenantId, submission.tenantId),
        eq(schema.textChunks.submissionId, submission.id)
      )
    );

  return {
    ...preprocessingRun,
    chunkCount: chunkCountRow?.chunkCount ?? 0,
    rulesApplied: preprocessingRun.rulesApplied as PreprocessRulesApplied
  };
}

async function getTenantPreprocessOptions(
  db: Database,
  tenantId: string
): Promise<PreprocessOptions> {
  const [settingsRow] = await db
    .select({
      settings: schema.tenantSettings.settings
    })
    .from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenantId))
    .limit(1);

  return resolvePreprocessOptions(settingsRow?.settings);
}
