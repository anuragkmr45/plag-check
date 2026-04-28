import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ReportPageContent } from "../../../../../features/reports/report-page-content";
import { getReportJsonForSubmission } from "../../../../../features/reports/report.service";
import { getRequiredSession } from "../../../../../lib/auth/server";

const submissionIdSchema = z.string().uuid();

export default async function SubmissionReportPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const { id } = await params;
  const parsedId = submissionIdSchema.safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const report = await getReportJsonForSubmission(session.user, parsedId.data);

  if (!report) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
          href={`/submissions/${report.submission.id}`}
        >
          Back to submission
        </Link>
      </div>
      <ReportPageContent report={report} />
    </section>
  );
}
