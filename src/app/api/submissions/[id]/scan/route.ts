import { NextResponse } from "next/server";
import { z } from "zod";
import { FeatureBudgetExhaustedError } from "../../../../../features/budgets/feature-budget.service";
import { AuthorizationError } from "../../../../../lib/rbac/guards";
import { csrfErrorResponse, jsonError } from "../../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../../lib/security/csrf";
import { getCurrentUserFromRequest } from "../../../../../server/services/auth.service";
import {
  ActiveScanJobExistsError,
  SubmissionScanNotFoundError,
  SubmissionScanPreprocessingMissingError,
  SubmissionScanStateError,
  startSubmissionScan
} from "../../../../../server/services/scanning.service";

export const dynamic = "force-dynamic";

const submissionIdSchema = z.string().uuid();
const scanRequestSchema = z
  .object({
    scanMode: z.enum(["standard", "deep", "fallback"]).optional()
  })
  .optional();

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
): Promise<NextResponse> {
  const csrfCheck = verifySameOriginRequest(request);

  if (!csrfCheck.ok) {
    return csrfErrorResponse();
  }

  const session = await getCurrentUserFromRequest(request);

  if (!session) {
    return jsonError({ message: "Unauthorized", status: 401 });
  }

  const { id } = await context.params;
  const parsedId = submissionIdSchema.safeParse(id);

  if (!parsedId.success) {
    return jsonError({ message: "Not found", status: 404 });
  }

  const body = (await request.json().catch(() => undefined)) as unknown;
  const parsedBody = scanRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonError({ message: "Invalid scan request", status: 400 });
  }

  const scan = await handleScanError(() =>
    startSubmissionScan(session.user, parsedId.data, {
      scanMode: parsedBody.data?.scanMode
    })
  );

  if (scan instanceof NextResponse) {
    return scan;
  }

  return NextResponse.json({
    scanJob: {
      attempts: scan.scanJob.attempts,
      id: scan.scanJob.id,
      provider: scan.scanJob.provider,
      status: scan.scanJob.status
    },
    submission: scan.submission
  });
}

async function handleScanError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SubmissionScanNotFoundError) {
      return jsonError({ message: "Not found", status: 404 });
    }

    if (error instanceof AuthorizationError) {
      return jsonError({ message: "Forbidden", status: 403 });
    }

    if (
      error instanceof SubmissionScanStateError ||
      error instanceof SubmissionScanPreprocessingMissingError ||
      error instanceof ActiveScanJobExistsError ||
      error instanceof FeatureBudgetExhaustedError
    ) {
      return jsonError({ message: error.message, status: 409 });
    }

    throw error;
  }
}
