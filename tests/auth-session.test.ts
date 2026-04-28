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

async function loadSessionModule(nodeEnv: "production" | "test" = "test") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/lib/auth/session");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session token handling", () => {
  it("generates opaque tokens and stores only deterministic hashes", async () => {
    const {
      areSessionTokenHashesEqual,
      createSessionToken,
      hashSessionToken
    } = await loadSessionModule();

    const firstToken = createSessionToken();
    const secondToken = createSessionToken();
    const firstHash = hashSessionToken(firstToken);
    const repeatedFirstHash = hashSessionToken(firstToken);
    const secondHash = hashSessionToken(secondToken);

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken.length).toBeGreaterThanOrEqual(40);
    expect(firstHash).not.toBe(firstToken);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repeatedFirstHash).toBe(firstHash);
    expect(areSessionTokenHashesEqual(firstHash, repeatedFirstHash)).toBe(true);
    expect(areSessionTokenHashesEqual(firstHash, secondHash)).toBe(false);
  });

  it("builds httpOnly lax cookies that are secure in production", async () => {
    const { createExpiredSessionCookie, createSessionCookie } =
      await loadSessionModule("production");
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const cookie = createSessionCookie("session-token", expiresAt);
    const expiredCookie = createExpiredSessionCookie();

    expect(cookie.value).toBe("session-token");
    expect(cookie.options).toMatchObject({
      expires: expiresAt,
      httpOnly: true,
      maxAge: 604_800,
      path: "/",
      sameSite: "lax",
      secure: true
    });
    expect(expiredCookie.value).toBe("");
    expect(expiredCookie.options).toMatchObject({
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: true
    });
  });

  it("reads only the configured session cookie from a cookie header", async () => {
    const { getSessionTokenFromCookieHeader, SESSION_COOKIE_NAME } =
      await loadSessionModule();
    const encodedToken = encodeURIComponent("token=value");

    expect(
      getSessionTokenFromCookieHeader(
        `theme=light; ${SESSION_COOKIE_NAME}=${encodedToken}; other=value`
      )
    ).toBe("token=value");
    expect(getSessionTokenFromCookieHeader("theme=light")).toBeNull();
    expect(getSessionTokenFromCookieHeader(null)).toBeNull();
  });
});
