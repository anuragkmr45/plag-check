import Link from "next/link";
import { getRequiredSession } from "../../../lib/auth/server";
import { getScanSummaryForSubmission } from "../../../server/services/scanning.service";
import { listSubmissions } from "../../../server/services/submissions.service";

export default async function ReportsPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const submissions = await listSubmissions(session.user);
  const reportRows = (
    await Promise.all(
      submissions.map(async (submission) => ({
        scanSummary: await getScanSummaryForSubmission(
          session.user,
          submission.id
        ),
        submission
      }))
    )
  ).filter((row) => row.scanSummary?.latestResult);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Completed originality reports with similarity, AI, and grammar
            evidence.
          </p>
        </div>
        <Link
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/scan/new"
        >
          New check
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {reportRows.length > 0 ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Report
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Similarity
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  AI
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Findings
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map(({ scanSummary, submission }) => {
                const result = scanSummary?.latestResult;

                if (!result) {
                  return null;
                }

                return (
                  <tr key={submission.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">
                        {submission.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(result.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatScore(result.similarityScore)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatProbability(result.aiProbability)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {result.sourceMatchCount} sources ·{" "}
                      {result.grammarFindingCount} grammar
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
                        href={`/submissions/${submission.id}/report`}
                      >
                        Open report
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <p className="text-sm text-slate-600">
              No completed reports are available yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}
