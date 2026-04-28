import { closeDatabaseConnection } from "../lib/db";
import {
  runScanWorkerLoop,
  type ScanWorkerIterationResult
} from "./workers/scan-worker";

async function main(): Promise<void> {
  const controller = new AbortController();

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      console.log(`Received ${signal}. Stopping scan worker...`);
      controller.abort();
    });
  }

  console.log("Scan worker started. Waiting for queued jobs...");

  const result = await runScanWorkerLoop({
    onIteration: logWorkerIteration,
    signal: controller.signal
  });

  console.log(`Scan worker stopped after ${result.iterations} iterations.`);
}

function logWorkerIteration(result: ScanWorkerIterationResult): void {
  if (result.status === "idle") {
    console.log("No queued scan jobs. Waiting...");
    return;
  }

  if (result.status === "succeeded") {
    console.log(`Scan job ${result.job.id} completed.`);
    return;
  }

  console.log(`Scan job ${result.job.id} did not complete: ${result.errorMessage}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
