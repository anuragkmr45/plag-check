import { closeDatabaseConnection } from "../lib/db";
import { runScanWorkerOnce } from "./workers/scan-worker";

async function main(): Promise<void> {
  const result = await runScanWorkerOnce();

  if (result.status === "idle") {
    console.log("No queued scan jobs.");
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
