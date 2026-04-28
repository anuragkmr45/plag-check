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

async function loadPreprocessingService() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/server/services/preprocessing.service");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("preprocessing service settings and state checks", () => {
  it("uses safe default preprocessing options", async () => {
    const { resolvePreprocessOptions } = await loadPreprocessingService();

    expect(resolvePreprocessOptions({})).toEqual({
      removeBibliography: true,
      removeQuotes: true,
      smallMatchWordThreshold: 14
    });
  });

  it("reads nested tenant preprocessing settings", async () => {
    const { resolvePreprocessOptions } = await loadPreprocessingService();

    expect(
      resolvePreprocessOptions({
        preprocessing: {
          removeBibliography: false,
          removeQuotes: true,
          smallMatchWordThreshold: 8
        }
      })
    ).toEqual({
      removeBibliography: false,
      removeQuotes: true,
      smallMatchWordThreshold: 8
    });
    expect(
      resolvePreprocessOptions({
        limits: {
          smallMatchWordThreshold: 5
        }
      })
    ).toEqual({
      removeBibliography: true,
      removeQuotes: true,
      smallMatchWordThreshold: 5
    });
  });

  it("allows preprocessing only for READY_FOR_SCAN submissions", async () => {
    const { isSubmissionReadyForPreprocessing } = await loadPreprocessingService();

    expect(isSubmissionReadyForPreprocessing({ status: "READY_FOR_SCAN" })).toBe(
      true
    );
    expect(isSubmissionReadyForPreprocessing({ status: "UPLOADED" })).toBe(false);
    expect(isSubmissionReadyForPreprocessing({ status: "SCAN_QUEUED" })).toBe(
      false
    );
  });
});
