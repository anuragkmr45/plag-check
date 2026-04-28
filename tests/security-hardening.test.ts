import { describe, expect, it, beforeEach } from "vitest";
import nextConfig from "../next.config";
import { securityHeaders } from "../src/lib/security/headers";
import {
  buildRateLimitKey,
  checkRateLimit,
  resetRateLimitStore
} from "../src/lib/security/rate-limit";
import { verifySameOriginRequest } from "../src/lib/security/csrf";

beforeEach(() => {
  resetRateLimitStore();
});

describe("security headers", () => {
  it("configures global browser security headers", async () => {
    const headerMap = new Map(
      securityHeaders.map((header) => [header.key, header.value])
    );
    const configuredHeaders = await nextConfig.headers?.();

    expect(configuredHeaders?.[0]?.source).toBe("/:path*");
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(headerMap.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headerMap.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'"
    );
  });
});

describe("same-origin CSRF check", () => {
  it("allows same-origin unsafe requests and blocks cross-origin requests", () => {
    expect(
      verifySameOriginRequest(
        new Request("https://plagcheck.test/api/submissions", {
          headers: {
            origin: "https://plagcheck.test"
          },
          method: "POST"
        })
      )
    ).toEqual({ ok: true });

    expect(
      verifySameOriginRequest(
        new Request("https://plagcheck.test/api/submissions", {
          headers: {
            origin: "https://evil.example"
          },
          method: "POST"
        })
      )
    ).toEqual({ ok: false, reason: "origin_mismatch" });
  });

  it("allows non-browser clients without origin headers but checks referer when present", () => {
    expect(
      verifySameOriginRequest(
        new Request("https://plagcheck.test/api/submissions", {
          method: "POST"
        })
      )
    ).toEqual({ ok: true });

    expect(
      verifySameOriginRequest(
        new Request("https://plagcheck.test/api/submissions", {
          headers: {
            referer: "https://evil.example/form"
          },
          method: "POST"
        })
      )
    ).toEqual({ ok: false, reason: "origin_mismatch" });
  });
});

describe("rate limiting", () => {
  it("limits repeated requests by namespace and client key", () => {
    const key = "auth.login:203.0.113.10";

    expect(
      checkRateLimit({
        key,
        limit: 2,
        now: 1_000,
        windowMs: 60_000
      })
    ).toMatchObject({ allowed: true, remaining: 1 });
    expect(
      checkRateLimit({
        key,
        limit: 2,
        now: 2_000,
        windowMs: 60_000
      })
    ).toMatchObject({ allowed: true, remaining: 0 });
    expect(
      checkRateLimit({
        key,
        limit: 2,
        now: 3_000,
        windowMs: 60_000
      })
    ).toMatchObject({ allowed: false, retryAfterSeconds: 58 });
    expect(
      checkRateLimit({
        key,
        limit: 2,
        now: 62_000,
        windowMs: 60_000
      })
    ).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("builds stable keys from forwarded client IPs", () => {
    const request = new Request("https://plagcheck.test/api/auth/login", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1"
      }
    });

    expect(buildRateLimitKey(request, "auth.login", ["user@example.edu"])).toBe(
      "auth.login:203.0.113.10:user@example.edu"
    );
  });
});
