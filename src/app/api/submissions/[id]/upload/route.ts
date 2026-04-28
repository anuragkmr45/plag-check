import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError } from "../../../../../lib/rbac/guards";
import {
  csrfErrorResponse,
  jsonError,
  rateLimitErrorResponse
} from "../../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../../lib/security/csrf";
import {
  buildRateLimitKey,
  checkRateLimit
} from "../../../../../lib/security/rate-limit";
import { getCurrentUserFromRequest } from "../../../../../server/services/auth.service";
import {
  SubmissionNotFoundError,
  SubmissionUploadStateError,
  UploadValidationError,
  uploadSubmissionFile
} from "../../../../../server/services/submission-upload.service";

export const dynamic = "force-dynamic";

const submissionIdSchema = z.string().uuid();
const uploadRateLimit = {
  limit: 20,
  windowMs: 5 * 60_000
};

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

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey(request, "submission.upload"),
    ...uploadRateLimit
  });

  if (!rateLimit.allowed) {
    return rateLimitErrorResponse(rateLimit);
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

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return jsonError({ message: "File is required", status: 400 });
  }

  const uploadResult = await handleUploadError(async () =>
    uploadSubmissionFile(session.user, parsedId.data, {
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      originalFilename: file.name,
      sizeBytes: file.size
    })
  );

  if (uploadResult instanceof NextResponse) {
    return uploadResult;
  }

  return NextResponse.json(
    {
      file: uploadResult.file,
      submission: uploadResult.submission
    },
    { status: 201 }
  );
}

async function handleUploadError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return jsonError({ message: error.message, status: 400 });
    }

    if (error instanceof SubmissionNotFoundError) {
      return jsonError({ message: "Not found", status: 404 });
    }

    if (error instanceof AuthorizationError) {
      return jsonError({ message: "Forbidden", status: 403 });
    }

    if (error instanceof SubmissionUploadStateError) {
      return jsonError({ message: error.message, status: 409 });
    }

    throw error;
  }
}
