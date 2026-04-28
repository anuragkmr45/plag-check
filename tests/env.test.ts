import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Env, EnvInput, SeedEnv } from "../src/lib/env";

type ParseEnv = (input: EnvInput) => Env;
type ParseSeedEnv = (input: EnvInput) => SeedEnv;

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

let parseEnv: ParseEnv;
let parseSeedEnv: ParseSeedEnv;

beforeAll(async () => {
  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  const envModule = await import("../src/lib/env");
  parseEnv = envModule.parseEnv;
  parseSeedEnv = envModule.parseSeedEnv;
});

describe("parseEnv", () => {
  it("returns a typed environment object for valid input", () => {
    const parsed = parseEnv(validEnv);

    expect(parsed.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(parsed.MINIO_BUCKET).toBe(validEnv.MINIO_BUCKET);
    expect(parsed.SCAN_PROVIDER).toBe("mock");
    expect(parsed.ALLOW_FALLBACK).toBe(true);
    expect(parsed.DEMO_WEB_SEARCH_PROVIDER).toBe("fallback");
  });

  it("parses demo-real provider settings from environment input", () => {
    const parsed = parseEnv({
      ...validEnv,
      ALLOW_FALLBACK: "false",
      DEMO_ACADEMIC_PROVIDER: "openalex",
      DEMO_AI_DETECTION_MODE: "llm",
      DEMO_AI_PROVIDER: "gemini",
      DEMO_GRAMMAR_PROVIDER: "languagetool-public",
      DEMO_MODE: "true",
      DEMO_WEB_SEARCH_PROVIDER: "tavily",
      GEMINI_MAX_OUTPUT_TOKENS: "900",
      GEMINI_MODEL: "gemini-2.5-flash-lite",
      LANGUAGETOOL_MAX_CHARS: "12000",
      LANGUAGETOOL_URL: "https://api.languagetool.org/v2/check",
      OPENALEX_MAX_RESULTS: "4",
      SCAN_PROVIDER: "demo-real",
      SHOW_PROVIDER_LABEL: "true",
      TAVILY_MAX_CHUNKS: "3",
      TAVILY_MAX_RESULTS: "5",
      TAVILY_SEARCH_DEPTH: "advanced"
    });

    expect(parsed.SCAN_PROVIDER).toBe("demo-real");
    expect(parsed.ALLOW_FALLBACK).toBe(false);
    expect(parsed.DEMO_MODE).toBe(true);
    expect(parsed.TAVILY_MAX_CHUNKS).toBe(3);
    expect(parsed.GEMINI_MAX_OUTPUT_TOKENS).toBe(900);
    expect(parsed.LANGUAGETOOL_MAX_CHARS).toBe(12000);
  });

  it("throws a clear error for invalid input", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        APP_URL: "not-a-url",
        SESSION_SECRET: "short"
      })
    ).toThrow(/Invalid environment variables:[\s\S]*APP_URL[\s\S]*SESSION_SECRET/);
  });

  it("includes missing variable names in validation errors", () => {
    const missingBucketEnv: EnvInput = { ...validEnv };
    delete missingBucketEnv.MINIO_BUCKET;

    expect(() => parseEnv(missingBucketEnv)).toThrow(/MINIO_BUCKET/);
  });
});

describe("parseSeedEnv", () => {
  it("returns typed seed credentials from environment input", () => {
    const parsed = parseSeedEnv({
      SEED_DEMO_USER_PASSWORD: "local-demo-password",
      SEED_SUPER_ADMIN_EMAIL: "SuperAdmin@Plagcheck.local",
      SEED_SUPER_ADMIN_PASSWORD: "local-super-admin-password"
    });

    expect(parsed.SEED_SUPER_ADMIN_EMAIL).toBe("superadmin@plagcheck.local");
    expect(parsed.SEED_SUPER_ADMIN_PASSWORD).toBe(
      "local-super-admin-password"
    );
    expect(parsed.SEED_DEMO_USER_PASSWORD).toBe("local-demo-password");
  });

  it("accepts local super admin aliases used by existing .env files", () => {
    const parsed = parseSeedEnv({
      DEMO_USER_PASSWORD: "local-demo-password",
      SUPER_ADMIN_EMAIL: "SuperAdmin@Plagcheck.local",
      SUPER_ADMIN_PASSWORD: "local-super-admin-password"
    });

    expect(parsed.SEED_SUPER_ADMIN_EMAIL).toBe("superadmin@plagcheck.local");
    expect(parsed.SEED_SUPER_ADMIN_PASSWORD).toBe(
      "local-super-admin-password"
    );
    expect(parsed.SEED_DEMO_USER_PASSWORD).toBe("local-demo-password");
  });

  it("requires valid seed email and a non-short seed password", () => {
    expect(() =>
      parseSeedEnv({
        SEED_SUPER_ADMIN_EMAIL: "not-an-email",
        SEED_SUPER_ADMIN_PASSWORD: "short"
      })
    ).toThrow(/SEED_SUPER_ADMIN_EMAIL[\s\S]*SEED_SUPER_ADMIN_PASSWORD/);
  });
});
