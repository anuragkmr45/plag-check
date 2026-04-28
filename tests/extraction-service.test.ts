import { afterEach, describe, expect, it, vi } from "vitest";
import type { EnvInput } from "../src/lib/env";

const validEnv = {
  DATABASE_URL: "postgresql://plagcheck:local-password@localhost:5432/plagcheck",
  APP_URL: "http://localhost:3000",
  SESSION_SECRET: "local-session-secret-at-least-32-characters",
  MINIO_ENDPOINT: "http://localhost:9000",
  MINIO_REGION: "us-east-1",
  MINIO_BUCKET: "plagcheck-documents",
  MINIO_ACCESS_KEY: "local-minio-access-key",
  MINIO_SECRET_KEY: "local-minio-secret-key"
} satisfies EnvInput;

async function loadExtractionService() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/server/services/extraction.service");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("extraction service state checks", () => {
  it("allows extraction only for uploaded submissions", async () => {
    const { isSubmissionReadyForExtraction } = await loadExtractionService();

    expect(isSubmissionReadyForExtraction({ status: "UPLOADED" })).toBe(true);
    expect(isSubmissionReadyForExtraction({ status: "DRAFT" })).toBe(false);
    expect(isSubmissionReadyForExtraction({ status: "READY_FOR_SCAN" })).toBe(
      false
    );
  });
});
