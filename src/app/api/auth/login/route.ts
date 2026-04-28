import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getRequestAuditContext,
  toAuthenticatedUserResponse
} from "../../../../lib/auth/http";
import { csrfErrorResponse, jsonError, rateLimitErrorResponse } from "../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../lib/security/csrf";
import {
  buildRateLimitKey,
  checkRateLimit
} from "../../../../lib/security/rate-limit";
import { loginWithPassword } from "../../../../server/services/auth.service";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1)
});

const invalidCredentialsResponse = {
  error: "Invalid email or password"
};
const loginRateLimit = {
  limit: 5,
  windowMs: 60_000
};

export async function POST(request: Request): Promise<NextResponse> {
  const csrfCheck = verifySameOriginRequest(request);

  if (!csrfCheck.ok) {
    return csrfErrorResponse();
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey(request, "auth.login"),
    ...loginRateLimit
  });

  if (!rateLimit.allowed) {
    return rateLimitErrorResponse(rateLimit);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError({
      message: invalidCredentialsResponse.error,
      status: 401
    });
  }

  const result = await loginWithPassword(
    parsed.data.email,
    parsed.data.password,
    {
      audit: getRequestAuditContext(request)
    }
  );

  if (!result) {
    return jsonError({
      message: invalidCredentialsResponse.error,
      status: 401
    });
  }

  const response = NextResponse.json({
    user: toAuthenticatedUserResponse(result.user)
  });
  response.cookies.set(
    result.cookie.name,
    result.cookie.value,
    result.cookie.options
  );

  return response;
}
