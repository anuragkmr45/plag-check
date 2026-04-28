import Link from "next/link";
import { listReviewCases } from "../../../../features/review/review.service";
import { getRequiredSession } from "../../../../lib/auth/server";

export default async function ReviewerQueuePage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const reviewCases = await listReviewCases(session.user);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Reviewer Queue
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review cases available to your role and tenant.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        {reviewCases.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {reviewCases.map((reviewCase) => (
              <li className="px-5 py-4" key={reviewCase.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="font-medium text-slate-950 underline-offset-4 hover:underline"
                      href={`/reviewer/cases/${reviewCase.id}`}
                    >
                      {reviewCase.submission.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      Submission status: {reviewCase.submission.status}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reviewer:{" "}
                      {reviewCase.assignedReviewerEmail ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={reviewCase.status} />
                    <Link
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      href={`/submissions/${reviewCase.submission.id}/report`}
                    >
                      View report
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5">
            <p className="text-sm text-slate-600">
              No review cases are available for your role.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  return (
    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
      {status}
    </span>
  );
}
