import { NextResponse } from "next/server";
import { getRequestAuditContext } from "../../../../lib/auth/http";
import {
  createExpiredSessionCookie,
  getSessionTokenFromCookieHeader
} from "../../../../lib/auth/session";
import { csrfErrorResponse } from "../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../lib/security/csrf";
import { destroySession } from "../../../../server/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const csrfCheck = verifySameOriginRequest(request);

  if (!csrfCheck.ok) {
    return csrfErrorResponse();
  }

  const sessionToken = getSessionTokenFromCookieHeader(
    request.headers.get("cookie")
  );
  const result = sessionToken
    ? await destroySession(sessionToken, {
        audit: getRequestAuditContext(request)
      })
    : {
        cookie: createExpiredSessionCookie()
      };

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    result.cookie.name,
    result.cookie.value,
    result.cookie.options
  );

  return response;
}
