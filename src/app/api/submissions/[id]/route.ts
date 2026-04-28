import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthorizationError } from "../../../../lib/rbac/guards";
import { getCurrentUserFromRequest } from "../../../../server/services/auth.service";
import { getSubmissionById } from "../../../../server/services/submissions.service";

export const dynamic = "force-dynamic";

const submissionIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
): Promise<NextResponse> {
  const session = await getCurrentUserFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = submissionIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const submission = await handleAuthorizationError(() =>
    getSubmissionById(session.user, parsedId.data)
  );

  if (submission instanceof NextResponse) {
    return submission;
  }

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ submission });
}

async function handleAuthorizationError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    throw error;
  }
}
