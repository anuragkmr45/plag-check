import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError } from "../../../lib/rbac/guards";
import { csrfErrorResponse, jsonError } from "../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../lib/security/csrf";
import { getCurrentUserFromRequest } from "../../../server/services/auth.service";
import {
  createSubmission,
  listSubmissions
} from "../../../server/services/submissions.service";

export const dynamic = "force-dynamic";

const createSubmissionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200)
});

const tenantFilterSchema = z.string().uuid().optional();

export async function GET(request: Request): Promise<NextResponse> {
  const session = await getCurrentUserFromRequest(request);

  if (!session) {
    return jsonError({ message: "Unauthorized", status: 401 });
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? undefined;
  const parsedTenantId = tenantFilterSchema.safeParse(tenantId);

  if (!parsedTenantId.success) {
    return jsonError({ message: "Invalid tenant filter", status: 400 });
  }

  const submissions = await handleAuthorizationError(() =>
    listSubmissions(session.user, {
      tenantId: parsedTenantId.data
    })
  );

  if (submissions instanceof NextResponse) {
    return submissions;
  }

  return NextResponse.json({ submissions });
}

export async function POST(request: Request): Promise<NextResponse> {
  const csrfCheck = verifySameOriginRequest(request);

  if (!csrfCheck.ok) {
    return csrfErrorResponse();
  }

  const session = await getCurrentUserFromRequest(request);

  if (!session) {
    return jsonError({ message: "Unauthorized", status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = createSubmissionSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonError({ message: "Invalid submission", status: 400 });
  }

  const submission = await handleAuthorizationError(() =>
    createSubmission(session.user, parsedBody.data)
  );

  if (submission instanceof NextResponse) {
    return submission;
  }

  return NextResponse.json({ submission }, { status: 201 });
}

async function handleAuthorizationError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.message === "Tenant is required") {
        return jsonError({ message: "Tenant is required", status: 400 });
      }

      return jsonError({ message: "Forbidden", status: 403 });
    }

    throw error;
  }
}
