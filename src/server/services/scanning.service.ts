import { and, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import {
  assertCanRunScan,
  consumeReservedFeatureUsageForSubmission,
  normalizeScanMode,
  recordFallbackUsage,
  reserveFeatureUsage
} from "../../features/budgets/feature-budget.service";
import {
  demoRealScanProvider,
  mockScanProvider,
  type ScanProvider,
  type ScanProviderInput,
  type ScanProviderResult
} from "../../features/scanning/providers";
import { getDatabase, schema, type Database } from "../../lib/db";
import { env } from "../../lib/env";
import {
  enqueueScanJob,
  getScanJobErrorMessage,
  isScanJobStatus,
  parseScanMode,
  type ScanJob,
  type ScanJobStatus,
  type ScanMode
} from "../../lib/jobs/scan-queue";
import type { RbacUser } from "../../lib/rbac/guards";
import {
  getSubmissionById,
  type SubmissionStatus,
  type SubmissionSummary
} from "./submissions.service";
type ActiveScanJobStatus = Extract<ScanJobStatus, "QUEUED" | "RUNNING">;

export type StartSubmissionScanResult = {
  scanJob: ScanJob;
  submission: {
    id: string;
    status: SubmissionStatus;
  };
};

export type StartSubmissionScanOptions = ScanningServiceOptions & {
  scanMode?: ScanMode;
};

export type ScanProcessingResult = {
  scanResultId: string;
  submission: {
    id: string;
    status: SubmissionStatus;
  };
};

export type SubmissionScanSummary = {
  latestJob: {
    attempts: number;
    createdAt: Date;
    errorMessage: string | null;
    finishedAt: Date | null;
    id: string;
    provider: string;
    scanMode: ScanMode;
    startedAt: Date | null;
    status: ScanJobStatus;
  } | null;
  latestResult: {
    aiAssessmentCount: number;
    aiProbability: number;
    createdAt: Date;
    grammarFindingCount: number;
    id: string;
    originalWordCount: number;
    scannedWordCount: number;
    similarityScore: number;
    sourceMatchCount: number;
  } | null;
};

type ScanningServiceOptions = {
  database?: Database;
};

type ScanWorkerProcessingOptions = ScanningServiceOptions & {
  provider?: ScanProvider;
};

type PreprocessingForScan = {
  id: string;
  originalWordCount: number;
  sanitizedText: string;
  sanitizedWordCount: number;
};

const activeScanJobStatuses = ["QUEUED", "RUNNING"] as const;

export class SubmissionScanNotFoundError extends Error {
  readonly code = "SUBMISSION_SCAN_NOT_FOUND";

  constructor(message = "Submission not found") {
    super(message);
    this.name = "SubmissionScanNotFoundError";
  }
}

export class SubmissionScanStateError extends Error {
  readonly code = "SUBMISSION_SCAN_STATE_ERROR";

  constructor(message = "Submission is not ready for scan") {
    super(message);
    this.name = "SubmissionScanStateError";
  }
}

export class SubmissionScanPreprocessingMissingError extends Error {
  readonly code = "SUBMISSION_SCAN_PREPROCESSING_MISSING";

  constructor(message = "Submission preprocessing is required before scan") {
    super(message);
    this.name = "SubmissionScanPreprocessingMissingError";
  }
}

export class ActiveScanJobExistsError extends Error {
  readonly code = "ACTIVE_SCAN_JOB_EXISTS";

  constructor(message = "An active scan is already queued or running") {
    super(message);
    this.name = "ActiveScanJobExistsError";
  }
}

export class ScanJobProcessingError extends Error {
  readonly code = "SCAN_JOB_PROCESSING_ERROR";

  constructor(message = "Scan job could not be processed") {
    super(message);
    this.name = "ScanJobProcessingError";
  }
}

export function isSubmissionReadyForScan(
  submission: Pick<SubmissionSummary, "status">
): boolean {
  return submission.status === "READY_FOR_SCAN";
}

export function isActiveScanJobStatus(
  status: string
): status is ActiveScanJobStatus {
  return (activeScanJobStatuses as readonly string[]).includes(status);
}

export function buildScanProviderInput(
  job: Pick<ScanJob, "submissionId" | "tenantId">,
  scanMode: ScanMode,
  preprocessing: PreprocessingForScan
): ScanProviderInput {
  return {
    originalWordCount: preprocessing.originalWordCount,
    scanMode,
    scannedWordCount: preprocessing.sanitizedWordCount,
    submissionId: job.submissionId,
    tenantId: job.tenantId,
    text: preprocessing.sanitizedText
  };
}

export function getConfiguredScanProviderId(): string {
  return env.SCAN_PROVIDER;
}

export function resolveScanProvider(providerId: string): ScanProvider {
  return providerId === "demo-real" ? demoRealScanProvider : mockScanProvider;
}

export async function startSubmissionScan(
  user: RbacUser,
  submissionId: string,
  options: StartSubmissionScanOptions = {}
): Promise<StartSubmissionScanResult> {
  const db = options.database ?? getDatabase();
  const scanMode = normalizeScanMode(options.scanMode);
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    throw new SubmissionScanNotFoundError();
  }

  if (!isSubmissionReadyForScan(submission)) {
    throw new SubmissionScanStateError();
  }

  const preprocessing = await getLatestPreprocessingForScan(db, submission);

  if (!preprocessing) {
    throw new SubmissionScanPreprocessingMissingError();
  }

  const estimate = await assertCanRunScan(
    {
      charCount: preprocessing.sanitizedText.length,
      scanMode,
      submissionId: submission.id,
      tenantId: submission.tenantId,
      userId: user.id,
      wordCount: preprocessing.sanitizedWordCount
    },
    {
      database: db
    }
  );

  return db.transaction(async (tx) => {
    const activeJob = await getActiveScanJob(tx, submission);

    if (activeJob) {
      throw new ActiveScanJobExistsError();
    }

    const [updatedSubmission] = await tx
      .update(schema.submissions)
      .set({
        status: "SCAN_QUEUED",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, submission.id),
          eq(schema.submissions.tenantId, submission.tenantId),
          eq(schema.submissions.status, "READY_FOR_SCAN")
        )
      )
      .returning({
        id: schema.submissions.id,
        status: schema.submissions.status
      });

    if (!updatedSubmission) {
      throw new SubmissionScanStateError();
    }

    const scanJob = await enqueueScanJob(submission.id, {
      database: tx,
      provider: getConfiguredScanProviderId(),
      scanMode,
      tenantId: submission.tenantId
    });

    if (scanMode === "fallback") {
      await recordFallbackUsage(
        {
          featureKey: "FALLBACK_SCAN",
          metadata: {
            reason: "local_fallback_scan_mode",
            scanMode
          },
          submissionId: submission.id,
          tenantId: submission.tenantId,
          units: 1,
          userId: user.id
        },
        {
          database: tx
        }
      );
    }

    for (const featureKey of ["FULL_CHECK", "MONTHLY_WORDS"] as const) {
      const item = estimate.items.find((entry) => entry.featureKey === featureKey);

      if (item) {
        await reserveFeatureUsage(
          {
            featureKey,
            metadata: {
              scanMode,
              scanProvider: getConfiguredScanProviderId()
            },
            submissionId: submission.id,
            tenantId: submission.tenantId,
            units: item.units,
            userId: user.id
          },
          {
            database: tx
          }
        );
      }
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.scan.queued",
      actorUserId: user.id,
      entityId: scanJob.id,
      entityType: "scan_job",
      metadata: {
        preprocessingRunId: preprocessing.id,
        scanMode,
        submissionId: submission.id
      },
      tenantId: submission.tenantId
    });

    return {
      scanJob,
      submission: updatedSubmission
    };
  });
}

export async function processScanJob(
  job: ScanJob,
  options: ScanWorkerProcessingOptions = {}
): Promise<ScanProcessingResult> {
  return processScanJobWithProvider(job, {
    ...options,
    provider: options.provider ?? resolveScanProvider(job.provider)
  });
}

export async function processScanJobWithMockProvider(
  job: ScanJob,
  options: ScanWorkerProcessingOptions = {}
): Promise<ScanProcessingResult> {
  return processScanJobWithProvider(job, {
    ...options,
    provider: options.provider ?? mockScanProvider
  });
}

async function processScanJobWithProvider(
  job: ScanJob,
  options: ScanWorkerProcessingOptions
): Promise<ScanProcessingResult> {
  const db = options.database ?? getDatabase();
  const provider = options.provider ?? mockScanProvider;
  const preprocessing = await getLatestPreprocessingForScan(db, job);

  if (!preprocessing) {
    throw new SubmissionScanPreprocessingMissingError();
  }

  await markSubmissionScanning(db, job, preprocessing.id);

  const providerResult = await provider.scan(
    buildScanProviderInput(job, job.scanMode, preprocessing)
  );

  const result = await storeScanProviderResult(db, job, preprocessing, providerResult);

  await consumeReservedFeatureUsageForSubmission(
    {
      featureKeys: ["FULL_CHECK", "MONTHLY_WORDS"],
      metadata: {
        scanMode: job.scanMode,
        scanResultId: result.scanResultId
      },
      submissionId: job.submissionId,
      tenantId: job.tenantId
    },
    {
      database: db
    }
  );

  return result;
}

export async function handleScanJobProcessingFailure(
  job: ScanJob,
  error: unknown,
  failedJob: ScanJob | null,
  options: ScanningServiceOptions = {}
): Promise<void> {
  const db = options.database ?? getDatabase();
  const submissionStatus: SubmissionStatus =
    failedJob?.status === "FAILED" ? "FAILED" : "SCAN_QUEUED";
  const auditAction =
    failedJob?.status === "FAILED"
      ? "submission.scan.failed"
      : "submission.scan.retry_queued";

  await db.transaction(async (tx) => {
    await tx
      .update(schema.submissions)
      .set({
        status: submissionStatus,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, job.submissionId),
          eq(schema.submissions.tenantId, job.tenantId),
          inArray(schema.submissions.status, ["SCAN_QUEUED", "SCANNING"])
        )
      );

    await tx.insert(schema.auditEvents).values({
      action: auditAction,
      actorUserId: null,
      entityId: job.id,
      entityType: "scan_job",
      metadata: {
        attempts: failedJob?.attempts ?? job.attempts,
        errorMessage: getScanJobErrorMessage(error),
        submissionId: job.submissionId
      },
      tenantId: job.tenantId
    });
  });
}

export async function getScanSummaryForSubmission(
  user: RbacUser,
  submissionId: string,
  options: ScanningServiceOptions = {}
): Promise<SubmissionScanSummary | null> {
  const db = options.database ?? getDatabase();
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    return null;
  }

  const [latestJob] = await db
    .select({
      attempts: schema.scanJobs.attempts,
      createdAt: schema.scanJobs.createdAt,
      errorMessage: schema.scanJobs.errorMessage,
      finishedAt: schema.scanJobs.finishedAt,
      id: schema.scanJobs.id,
      provider: schema.scanJobs.provider,
      scanMode: schema.scanJobs.scanMode,
      startedAt: schema.scanJobs.startedAt,
      status: schema.scanJobs.status
    })
    .from(schema.scanJobs)
    .where(
      and(
        eq(schema.scanJobs.tenantId, submission.tenantId),
        eq(schema.scanJobs.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.scanJobs.createdAt))
    .limit(1);

  const [latestResult] = await db
    .select({
      aiProbability: schema.scanResults.aiProbability,
      createdAt: schema.scanResults.createdAt,
      id: schema.scanResults.id,
      originalWordCount: schema.scanResults.originalWordCount,
      scannedWordCount: schema.scanResults.scannedWordCount,
      similarityScore: schema.scanResults.similarityScore
    })
    .from(schema.scanResults)
    .where(
      and(
        eq(schema.scanResults.tenantId, submission.tenantId),
        eq(schema.scanResults.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.scanResults.createdAt))
    .limit(1);

  if (!latestJob && !latestResult) {
    return null;
  }

  return {
    latestJob: latestJob
      ? {
          ...latestJob,
          scanMode: parseScanMode(latestJob.scanMode),
          status: parseStoredScanJobStatus(latestJob.status)
        }
      : null,
    latestResult: latestResult
      ? {
          ...latestResult,
          aiAssessmentCount: await countAiAssessments(
            db,
            latestResult.id,
            submission.tenantId
          ),
          grammarFindingCount: await countGrammarFindings(
            db,
            latestResult.id,
            submission.tenantId
          ),
          sourceMatchCount: await countSourceMatches(
            db,
            latestResult.id,
            submission.tenantId
          )
        }
      : null
  };
}

async function markSubmissionScanning(
  db: Database,
  job: ScanJob,
  preprocessingRunId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    const [submission] = await tx
      .update(schema.submissions)
      .set({
        status: "SCANNING",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, job.submissionId),
          eq(schema.submissions.tenantId, job.tenantId),
          inArray(schema.submissions.status, ["SCAN_QUEUED", "SCANNING"])
        )
      )
      .returning({
        id: schema.submissions.id
      });

    if (!submission) {
      throw new ScanJobProcessingError("Submission is not queued for scanning");
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.scan.started",
      actorUserId: null,
      entityId: job.id,
      entityType: "scan_job",
      metadata: {
        preprocessingRunId,
        submissionId: job.submissionId
      },
      tenantId: job.tenantId
    });
  });
}

async function storeScanProviderResult(
  db: Database,
  job: ScanJob,
  preprocessing: PreprocessingForScan,
  providerResult: ScanProviderResult
): Promise<ScanProcessingResult> {
  return db.transaction(async (tx) => {
    const [scanResult] = await tx
      .insert(schema.scanResults)
      .values({
        aiProbability: providerResult.aiProbability,
        originalWordCount: preprocessing.originalWordCount,
        providerMetadata: providerResult.providerMetadata,
        scannedWordCount: preprocessing.sanitizedWordCount,
        scanJobId: job.id,
        similarityScore: providerResult.similarityScore,
        submissionId: job.submissionId,
        tenantId: job.tenantId
      })
      .returning({
        id: schema.scanResults.id
      });

    if (providerResult.sourceMatches.length > 0) {
      await tx.insert(schema.sourceMatches).values(
        providerResult.sourceMatches.map((match) => ({
          endChar: match.endChar,
          matchedText: match.matchedText,
          scanResultId: scanResult.id,
          similarityScore: match.similarityScore,
          sourceTitle: match.sourceTitle,
          sourceUrl: match.sourceUrl,
          startChar: match.startChar,
          tenantId: job.tenantId
        }))
      );
    }

    if (providerResult.aiAssessments.length > 0) {
      await tx.insert(schema.aiAssessments).values(
        providerResult.aiAssessments.map((assessment) => ({
          explanation: assessment.explanation,
          label: assessment.label,
          probability: assessment.probability,
          scanResultId: scanResult.id,
          sentenceEndChar: assessment.sentenceEndChar,
          sentenceStartChar: assessment.sentenceStartChar,
          tenantId: job.tenantId
        }))
      );
    }

    if (providerResult.grammarFindings.length > 0) {
      await tx.insert(schema.grammarFindings).values(
        providerResult.grammarFindings.map((finding) => ({
          length: finding.length,
          message: finding.message,
          offset: finding.offset,
          replacementSuggestions: finding.replacementSuggestions,
          scanResultId: scanResult.id,
          tenantId: job.tenantId
        }))
      );
    }

    const [submission] = await tx
      .update(schema.submissions)
      .set({
        status: "SCAN_COMPLETE",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, job.submissionId),
          eq(schema.submissions.tenantId, job.tenantId),
          eq(schema.submissions.status, "SCANNING")
        )
      )
      .returning({
        id: schema.submissions.id,
        status: schema.submissions.status
      });

    if (!submission) {
      throw new ScanJobProcessingError("Submission scan status could not be completed");
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.scan.completed",
      actorUserId: null,
      entityId: scanResult.id,
      entityType: "scan_result",
      metadata: {
        aiAssessmentCount: providerResult.aiAssessments.length,
        aiProbability: providerResult.aiProbability,
        grammarFindingCount: providerResult.grammarFindings.length,
        scanJobId: job.id,
        similarityScore: providerResult.similarityScore,
        sourceMatchCount: providerResult.sourceMatches.length,
        submissionId: job.submissionId
      },
      tenantId: job.tenantId
    });

    return {
      scanResultId: scanResult.id,
      submission
    };
  });
}

async function getLatestPreprocessingForScan(
  db: Database,
  submission: Pick<SubmissionSummary, "id" | "tenantId"> | Pick<ScanJob, "submissionId" | "tenantId">
): Promise<PreprocessingForScan | null> {
  const submissionId =
    "submissionId" in submission ? submission.submissionId : submission.id;

  const [preprocessing] = await db
    .select({
      id: schema.preprocessingRuns.id,
      originalWordCount: schema.preprocessingRuns.originalWordCount,
      sanitizedText: schema.preprocessingRuns.sanitizedText,
      sanitizedWordCount: schema.preprocessingRuns.sanitizedWordCount
    })
    .from(schema.preprocessingRuns)
    .where(
      and(
        eq(schema.preprocessingRuns.tenantId, submission.tenantId),
        eq(schema.preprocessingRuns.submissionId, submissionId)
      )
    )
    .orderBy(desc(schema.preprocessingRuns.createdAt))
    .limit(1);

  return preprocessing ?? null;
}

async function countSourceMatches(
  db: Database,
  scanResultId: string,
  tenantId: string
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.sourceMatches)
    .where(
      and(
        eq(schema.sourceMatches.tenantId, tenantId),
        eq(schema.sourceMatches.scanResultId, scanResultId)
      )
    );

  return result.count;
}

async function countAiAssessments(
  db: Database,
  scanResultId: string,
  tenantId: string
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.aiAssessments)
    .where(
      and(
        eq(schema.aiAssessments.tenantId, tenantId),
        eq(schema.aiAssessments.scanResultId, scanResultId)
      )
    );

  return result.count;
}

async function countGrammarFindings(
  db: Database,
  scanResultId: string,
  tenantId: string
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.grammarFindings)
    .where(
      and(
        eq(schema.grammarFindings.tenantId, tenantId),
        eq(schema.grammarFindings.scanResultId, scanResultId)
      )
    );

  return result.count;
}

function parseStoredScanJobStatus(status: string): ScanJobStatus {
  if (isScanJobStatus(status)) {
    return status;
  }

  throw new Error(`Unknown scan job status: ${status}`);
}

async function getActiveScanJob(
  db: Database,
  submission: Pick<SubmissionSummary, "id" | "tenantId">
): Promise<{ id: string } | null> {
  const conditions: SQL[] = [
    eq(schema.scanJobs.tenantId, submission.tenantId),
    eq(schema.scanJobs.submissionId, submission.id),
    inArray(schema.scanJobs.status, [...activeScanJobStatuses])
  ];

  const [job] = await db
    .select({
      id: schema.scanJobs.id
    })
    .from(schema.scanJobs)
    .where(and(...conditions))
    .limit(1);

  return job ?? null;
}
