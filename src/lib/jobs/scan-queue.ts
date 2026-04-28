import { and, eq, sql } from "drizzle-orm";
import type { Pool } from "pg";
import { getDatabase, getDatabasePool, schema, type Database } from "../db";

export const DEFAULT_SCAN_JOB_PROVIDER = "mock";
export const DEFAULT_SCAN_JOB_MAX_ATTEMPTS = 3;

export const scanJobStatuses = [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED"
] as const;

export type ScanJobStatus = (typeof scanJobStatuses)[number];

export type ScanMode = "standard" | "deep" | "fallback";

export type ScanJob = Omit<typeof schema.scanJobs.$inferSelect, "scanMode" | "status"> & {
  scanMode: ScanMode;
  status: ScanJobStatus;
};

export type EnqueueScanJobOptions = {
  database?: Database;
  provider?: string;
  scanMode?: ScanMode;
  tenantId?: string;
};

export type ClaimScanJobOptions = {
  maxAttempts?: number;
  pool?: Pool;
};

export type MarkScanJobFailedOptions = {
  database?: Database;
  maxAttempts?: number;
};

type ScanJobRow = {
  attempts: number;
  created_at: Date;
  error_message: string | null;
  finished_at: Date | null;
  id: string;
  provider: string;
  scan_mode: string;
  started_at: Date | null;
  status: string;
  submission_id: string;
  tenant_id: string;
};

const scanJobSelect = {
  attempts: schema.scanJobs.attempts,
  createdAt: schema.scanJobs.createdAt,
  errorMessage: schema.scanJobs.errorMessage,
  finishedAt: schema.scanJobs.finishedAt,
  id: schema.scanJobs.id,
  provider: schema.scanJobs.provider,
  scanMode: schema.scanJobs.scanMode,
  startedAt: schema.scanJobs.startedAt,
  status: schema.scanJobs.status,
  submissionId: schema.scanJobs.submissionId,
  tenantId: schema.scanJobs.tenantId
};

export async function enqueueScanJob(
  submissionId: string,
  options: EnqueueScanJobOptions = {}
): Promise<ScanJob> {
  const db = options.database ?? getDatabase();
  const submissionConditions = [eq(schema.submissions.id, submissionId)];

  if (options.tenantId) {
    submissionConditions.push(eq(schema.submissions.tenantId, options.tenantId));
  }

  const [submission] = await db
    .select({
      id: schema.submissions.id,
      tenantId: schema.submissions.tenantId
    })
    .from(schema.submissions)
    .where(and(...submissionConditions))
    .limit(1);

  if (!submission) {
    throw new ScanJobSubmissionNotFoundError();
  }

  const [job] = await db
    .insert(schema.scanJobs)
    .values({
      attempts: 0,
      provider: options.provider ?? DEFAULT_SCAN_JOB_PROVIDER,
      scanMode: options.scanMode ?? "standard",
      status: "QUEUED",
      submissionId: submission.id,
      tenantId: submission.tenantId
    })
    .returning(scanJobSelect);

  return mapScanJob(job);
}

export async function claimNextScanJob(
  options: ClaimScanJobOptions = {}
): Promise<ScanJob | null> {
  const pool = options.pool ?? getDatabasePool();
  const maxAttempts = normalizeMaxAttempts(options.maxAttempts);
  const client = await pool.connect();

  try {
    await client.query("begin");

    const result = await client.query<ScanJobRow>(
      `
        update scan_jobs
        set
          status = 'RUNNING',
          attempts = attempts + 1,
          error_message = null,
          started_at = now(),
          finished_at = null
        where id = (
          select id
          from scan_jobs
          where status = 'QUEUED'
            and attempts < $1
          order by created_at asc
          for update skip locked
          limit 1
        )
        returning
          id,
          tenant_id,
          submission_id,
          provider,
          scan_mode,
          status,
          attempts,
          error_message,
          started_at,
          finished_at,
          created_at
      `,
      [maxAttempts]
    );

    await client.query("commit");

    return result.rows[0] ? mapScanJobRow(result.rows[0]) : null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function markJobRunning(
  jobId: string,
  options: { database?: Database } = {}
): Promise<ScanJob | null> {
  const db = options.database ?? getDatabase();
  const [job] = await db
    .update(schema.scanJobs)
    .set({
      attempts: sql`${schema.scanJobs.attempts} + 1`,
      errorMessage: null,
      finishedAt: null,
      startedAt: new Date(),
      status: "RUNNING"
    })
    .where(eq(schema.scanJobs.id, jobId))
    .returning(scanJobSelect);

  return job ? mapScanJob(job) : null;
}

export async function markJobSucceeded(
  jobId: string,
  options: { database?: Database } = {}
): Promise<ScanJob | null> {
  const db = options.database ?? getDatabase();
  const [job] = await db
    .update(schema.scanJobs)
    .set({
      errorMessage: null,
      finishedAt: new Date(),
      status: "SUCCEEDED"
    })
    .where(eq(schema.scanJobs.id, jobId))
    .returning(scanJobSelect);

  return job ? mapScanJob(job) : null;
}

export async function markJobFailed(
  jobId: string,
  error: unknown,
  options: MarkScanJobFailedOptions = {}
): Promise<ScanJob | null> {
  const db = options.database ?? getDatabase();
  const [currentJob] = await db
    .select({
      attempts: schema.scanJobs.attempts
    })
    .from(schema.scanJobs)
    .where(eq(schema.scanJobs.id, jobId))
    .limit(1);

  if (!currentJob) {
    return null;
  }

  const status = getFailedScanJobStatus(
    currentJob.attempts,
    options.maxAttempts
  );
  const [job] = await db
    .update(schema.scanJobs)
    .set({
      errorMessage: getScanJobErrorMessage(error),
      finishedAt: status === "FAILED" ? new Date() : null,
      status
    })
    .where(eq(schema.scanJobs.id, jobId))
    .returning(scanJobSelect);

  return job ? mapScanJob(job) : null;
}

export function getFailedScanJobStatus(
  attempts: number,
  maxAttempts = DEFAULT_SCAN_JOB_MAX_ATTEMPTS
): Extract<ScanJobStatus, "QUEUED" | "FAILED"> {
  const normalizedMaxAttempts = normalizeMaxAttempts(maxAttempts);

  if (!Number.isInteger(attempts) || attempts < 0) {
    throw new Error("Scan job attempts must be a nonnegative integer");
  }

  return attempts < normalizedMaxAttempts ? "QUEUED" : "FAILED";
}

export function getScanJobErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown scan job error";

  return message.slice(0, 1_000);
}

export function isScanJobStatus(status: string): status is ScanJobStatus {
  return (scanJobStatuses as readonly string[]).includes(status);
}

export class ScanJobSubmissionNotFoundError extends Error {
  readonly code = "SCAN_JOB_SUBMISSION_NOT_FOUND";

  constructor(message = "Submission not found for scan job") {
    super(message);
    this.name = "ScanJobSubmissionNotFoundError";
  }
}

function normalizeMaxAttempts(
  maxAttempts = DEFAULT_SCAN_JOB_MAX_ATTEMPTS
): number {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("Scan job max attempts must be a positive integer");
  }

  return maxAttempts;
}

function mapScanJob(row: typeof schema.scanJobs.$inferSelect): ScanJob {
  return {
    ...row,
    scanMode: parseScanMode(row.scanMode),
    status: parseScanJobStatus(row.status)
  };
}

function mapScanJobRow(row: ScanJobRow): ScanJob {
  return {
    attempts: row.attempts,
    createdAt: row.created_at,
    errorMessage: row.error_message,
    finishedAt: row.finished_at,
    id: row.id,
    provider: row.provider,
    scanMode: parseScanMode(row.scan_mode),
    startedAt: row.started_at,
    status: parseScanJobStatus(row.status),
    submissionId: row.submission_id,
    tenantId: row.tenant_id
  };
}

export function parseScanMode(value: string): ScanMode {
  if (value === "standard" || value === "deep" || value === "fallback") {
    return value;
  }

  return "standard";
}

function parseScanJobStatus(status: string): ScanJobStatus {
  if (isScanJobStatus(status)) {
    return status;
  }

  throw new Error(`Unknown scan job status: ${status}`);
}
