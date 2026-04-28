import {
  claimNextScanJob,
  DEFAULT_SCAN_JOB_MAX_ATTEMPTS,
  getScanJobErrorMessage,
  markJobFailed,
  markJobSucceeded,
  type ScanJob
} from "../../lib/jobs/scan-queue";
import {
  handleScanJobProcessingFailure,
  processScanJob
} from "../services/scanning.service";

export type ScanWorkerProcessor = (job: ScanJob) => Promise<unknown>;

export type ScanWorkerIterationResult =
  | {
      status: "idle";
    }
  | {
      job: ScanJob;
      status: "succeeded";
    }
  | {
      errorMessage: string;
      job: ScanJob;
      status: "failed";
    };

export type ScanWorkerLoopResult = {
  iterations: number;
  stopped: boolean;
};

export type ScanWorkerOptions = {
  claimNextJob?: () => Promise<ScanJob | null>;
  markFailed?: (
    jobId: string,
    error: unknown,
    options?: { maxAttempts?: number }
  ) => Promise<ScanJob | null>;
  markSucceeded?: (jobId: string) => Promise<ScanJob | null>;
  maxAttempts?: number;
  onProcessingFailure?: (
    job: ScanJob,
    error: unknown,
    failedJob: ScanJob | null
  ) => Promise<void>;
  processor?: ScanWorkerProcessor;
};

export type ScanWorkerLoopOptions = ScanWorkerOptions & {
  idleDelayMs?: number;
  maxIterations?: number;
  onIteration?: (result: ScanWorkerIterationResult) => Promise<void> | void;
  signal?: AbortSignal;
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
};

export async function runScanWorkerOnce(
  options: ScanWorkerOptions = {}
): Promise<ScanWorkerIterationResult> {
  const processor = options.processor ?? processScanJob;

  return processNextScanJob(processor, {
    onProcessingFailure: handleScanJobProcessingFailure,
    ...options
  });
}

export async function runScanWorkerLoop(
  options: ScanWorkerLoopOptions = {}
): Promise<ScanWorkerLoopResult> {
  const idleDelayMs = options.idleDelayMs ?? 2_000;
  const sleep = options.sleep ?? sleepFor;
  let iterations = 0;

  while (!options.signal?.aborted) {
    const result = await runScanWorkerOnce(options);
    iterations += 1;

    await options.onIteration?.(result);

    if (options.maxIterations && iterations >= options.maxIterations) {
      return {
        iterations,
        stopped: true
      };
    }

    if (result.status === "idle") {
      await sleep(idleDelayMs, options.signal);
    }
  }

  return {
    iterations,
    stopped: true
  };
}

export async function processNextScanJob(
  processor: ScanWorkerProcessor,
  options: ScanWorkerOptions = {}
): Promise<ScanWorkerIterationResult> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_SCAN_JOB_MAX_ATTEMPTS;
  const claimNextJob =
    options.claimNextJob ?? (() => claimNextScanJob({ maxAttempts }));
  const succeed = options.markSucceeded ?? markJobSucceeded;
  const fail = options.markFailed ?? markJobFailed;
  const claimedJob = await claimNextJob();

  if (!claimedJob) {
    return {
      status: "idle"
    };
  }

  try {
    await processor(claimedJob);
    const succeededJob = await succeed(claimedJob.id);

    return {
      job: succeededJob ?? claimedJob,
      status: "succeeded"
    };
  } catch (error) {
    const failedJob = await fail(claimedJob.id, error, {
      maxAttempts
    });

    await options.onProcessingFailure?.(claimedJob, error, failedJob);

    return {
      errorMessage: getScanJobErrorMessage(error),
      job: failedJob ?? claimedJob,
      status: "failed"
    };
  }
}

function sleepFor(
  milliseconds: number,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted || milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      {
        once: true
      }
    );
  });
}
