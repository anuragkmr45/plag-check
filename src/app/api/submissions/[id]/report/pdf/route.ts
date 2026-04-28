import { z } from "zod";
import {
  ReportPdfNotFoundError,
  generateSubmissionReportPdf
} from "../../../../../../features/reports/report-export.service";
import {
  csrfErrorResponse,
  jsonError
} from "../../../../../../lib/security/api-responses";
import { verifySameOriginRequest } from "../../../../../../lib/security/csrf";
import { getCurrentUserFromRequest } from "../../../../../../server/services/auth.service";

export const dynamic = "force-dynamic";

const submissionIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
): Promise<Response> {
  const csrfCheck = verifySameOriginRequest(request, {
    force: true
  });

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

  try {
    const generatedReport = await generateSubmissionReportPdf(
      session.user,
      parsedId.data
    );

    return new Response(new Uint8Array(generatedReport.pdfBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="${generatedReport.filename}"`,
        "Content-Type": "application/pdf",
        "X-Report-Snapshot-Version": String(
          generatedReport.snapshot.snapshotVersion
        )
      },
      status: 200
    });
  } catch (error) {
    if (error instanceof ReportPdfNotFoundError) {
      return jsonError({ message: "Not found", status: 404 });
    }

    throw error;
  }
}
