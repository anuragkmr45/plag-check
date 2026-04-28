import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCAN_JOB_MAX_ATTEMPTS,
  getFailedScanJobStatus,
  getScanJobErrorMessage,
  isScanJobStatus
} from "../src/lib/jobs/scan-queue";
import {
  processNextScanJob,
  runScanWorkerOnce,
  type ScanWorkerProcessor
} from "../src/server/workers/scan-worker";
import type { ScanJob } from "../src/lib/jobs/scan-queue";

const scanJob: ScanJob = {
  attempts: 1,
  createdAt: new Date("2026-04-28T00:00:00.000Z"),
  errorMessage: null,
  finishedAt: null,
  id: "00000000-0000-4000-8000-000000000101",
  provider: "mock",
  scanMode: "standard",
  startedAt: new Date("2026-04-28T00:01:00.000Z"),
  status: "RUNNING",
  submissionId: "00000000-0000-4000-8000-000000000201",
  tenantId: "00000000-0000-4000-8000-000000000301"
};

describe("scan queue retry helpers", () => {
  it("requeues failed jobs until the max attempt is reached", () => {
    expect(getFailedScanJobStatus(1, DEFAULT_SCAN_JOB_MAX_ATTEMPTS)).toBe(
      "QUEUED"
    );
    expect(
      getFailedScanJobStatus(
        DEFAULT_SCAN_JOB_MAX_ATTEMPTS,
        DEFAULT_SCAN_JOB_MAX_ATTEMPTS
      )
    ).toBe("FAILED");
  });

  it("validates retry attempt inputs", () => {
    expect(() => getFailedScanJobStatus(-1)).toThrow(
      "Scan job attempts must be a nonnegative integer"
    );
    expect(() => getFailedScanJobStatus(1, 0)).toThrow(
      "Scan job max attempts must be a positive integer"
    );
  });

  it("normalizes worker error messages without exposing unknown objects", () => {
    expect(getScanJobErrorMessage(new Error("provider unavailable"))).toBe(
      "provider unavailable"
    );
    expect(getScanJobErrorMessage("plain failure")).toBe("plain failure");
    expect(getScanJobErrorMessage({ detail: "hidden" })).toBe(
      "Unknown scan job error"
    );
  });

  it("recognizes only canonical scan job statuses", () => {
    expect(isScanJobStatus("QUEUED")).toBe(true);
    expect(isScanJobStatus("RUNNING")).toBe(true);
    expect(isScanJobStatus("SUCCEEDED")).toBe(true);
    expect(isScanJobStatus("FAILED")).toBe(true);
    expect(isScanJobStatus("SCAN_COMPLETE")).toBe(false);
  });
});

describe("scan worker iteration", () => {
  it("returns idle when no queued job can be claimed", async () => {
    await expect(
      runScanWorkerOnce({
        claimNextJob: async () => null
      })
    ).resolves.toEqual({
      status: "idle"
    });
  });

  it("marks claimed jobs as succeeded when processing succeeds", async () => {
    const processedJobIds: string[] = [];
    const processor: ScanWorkerProcessor = async (job) => {
      processedJobIds.push(job.id);
    };

    const result = await processNextScanJob(processor, {
      claimNextJob: async () => scanJob,
      markSucceeded: async (jobId) => ({
        ...scanJob,
        finishedAt: new Date("2026-04-28T00:02:00.000Z"),
        id: jobId,
        status: "SUCCEEDED"
      })
    });

    expect(processedJobIds).toEqual([scanJob.id]);
    expect(result).toMatchObject({
      job: {
        id: scanJob.id,
        status: "SUCCEEDED"
      },
      status: "succeeded"
    });
  });

  it("marks claimed jobs as failed or retryable when processing fails", async () => {
    const failureHookCalls: Array<{
      failedStatus: ScanJob["status"] | null;
      jobId: string;
    }> = [];
    const result = await processNextScanJob(
      async () => {
        throw new Error("mock scan failed");
      },
      {
        claimNextJob: async () => scanJob,
        markFailed: async (jobId, error) => ({
          ...scanJob,
          errorMessage: getScanJobErrorMessage(error),
          id: jobId,
          status: "QUEUED"
        }),
        onProcessingFailure: async (job, _error, failedJob) => {
          failureHookCalls.push({
            failedStatus: failedJob?.status ?? null,
            jobId: job.id
          });
        }
      }
    );

    expect(failureHookCalls).toEqual([
      {
        failedStatus: "QUEUED",
        jobId: scanJob.id
      }
    ]);
    expect(result).toMatchObject({
      errorMessage: "mock scan failed",
      job: {
        errorMessage: "mock scan failed",
        id: scanJob.id,
        status: "QUEUED"
      },
      status: "failed"
    });
  });
});
