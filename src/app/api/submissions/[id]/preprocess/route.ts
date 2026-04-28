import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError } from "../../../../../lib/rbac/guards";
import { csrfErrorResponse, jsonError } from "../../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../../lib/security/csrf";
import { getCurrentUserFromRequest } from "../../../../../server/services/auth.service";
import {
  PreprocessingSourceMissingError,
  PreprocessingStateError,
  SubmissionPreprocessingNotFoundError,
  preprocessSubmissionText
} from "../../../../../server/services/preprocessing.service";

export const dynamic = "force-dynamic";

const submissionIdSchema = z.string().uuid();

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

  const preprocessing = await handlePreprocessingError(() =>
    preprocessSubmissionText(session.user, parsedId.data)
  );

  if (preprocessing instanceof NextResponse) {
    return preprocessing;
  }

  return NextResponse.json({
    preprocessingRun: preprocessing.preprocessingRun,
    submission: preprocessing.submission
  });
}

async function handlePreprocessingError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SubmissionPreprocessingNotFoundError) {
      return jsonError({ message: "Not found", status: 404 });
    }

    if (error instanceof AuthorizationError) {
      return jsonError({ message: "Forbidden", status: 403 });
    }

    if (error instanceof PreprocessingStateError) {
      return jsonError({ message: error.message, status: 409 });
    }

    if (error instanceof PreprocessingSourceMissingError) {
      return jsonError({ message: error.message, status: 409 });
    }

    throw error;
  }
}
