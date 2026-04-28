import Link from "next/link";
import { getRequiredSession } from "../../../lib/auth/server";
import { listSubmissions } from "../../../server/services/submissions.service";

export default async function SubmissionsPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const submissions = await listSubmissions(session.user);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Submissions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create submissions and review uploaded document status.
          </p>
        </div>
        <Link
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/submissions/new"
        >
          New submission
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {submissions.length > 0 ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Title
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Created
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {submission.title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(submission.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
                      href={`/submissions/${submission.id}`}
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <p className="text-sm text-slate-600">
              No submissions have been created yet.
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
