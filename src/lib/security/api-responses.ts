import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";

type JsonErrorOptions = {
  code?: string;
  headers?: HeadersInit;
  message: string;
  status: number;
};

export function jsonError({
  code,
  headers,
  message,
  status
}: JsonErrorOptions): NextResponse {
  return NextResponse.json(
    {
      ...(code ? { code } : {}),
      error: message
    },
    {
      headers,
      status
    }
  );
}

export function csrfErrorResponse(): NextResponse {
  return jsonError({
    code: "CSRF_CHECK_FAILED",
    message: "Invalid request origin",
    status: 403
  });
}

export function rateLimitErrorResponse(
  result: Extract<RateLimitResult, { allowed: false }>
): NextResponse {
  return jsonError({
    code: "RATE_LIMITED",
    headers: {
      "Retry-After": String(result.retryAfterSeconds),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
    },
    message: "Too many requests",
    status: 429
  });
}
