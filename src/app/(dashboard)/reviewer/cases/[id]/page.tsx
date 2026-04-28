import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  REVIEW_ACTION_STATUSES,
  canAssignReviewCaseToSelf,
  canModifyReviewCase,
  getReviewCaseDetail,
  isAllowedReviewStatusTransition
} from "../../../../../features/review/review.service";
import { getRequiredSession } from "../../../../../lib/auth/server";
import {
  addReviewCaseNoteAction,
  assignReviewCaseToSelfAction,
  setReviewCaseStatusAction
} from "../../actions";

const reviewCaseIdSchema = z.string().uuid();

export default async function ReviewerCasePage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const { id } = await params;
  const parsedId = reviewCaseIdSchema.safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const detail = await getReviewCaseDetail(session.user, parsedId.data);

  if (!detail) {
    notFound();
  }

  const { reviewCase } = detail;
  const canAssignSelf = canAssignReviewCaseToSelf(session.user, reviewCase);
  const canModify = canModifyReviewCase(session.user, reviewCase);

  return (
    <section className="space-y-6">
      <Link
        className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
        href="/reviewer/queue"
      >
        Back to reviewer queue
      </Link>

      <header className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Review case</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {reviewCase.submission.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Submission status: {reviewCase.submission.status}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
            {reviewCase.status}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href={`/submissions/${reviewCase.submission.id}/report`}
          >
            View report
          </Link>
          {canAssignSelf ? (
            <form action={assignReviewCaseToSelfAction}>
              <input name="caseId" type="hidden" value={reviewCase.id} />
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                type="submit"
              >
                Assign to me
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Event timeline
              </h2>
            </div>
            {detail.events.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {detail.events.map((event) => (
                  <li className="space-y-2 px-5 py-4" key={event.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-medium text-slate-950">
                        {formatEventType(event.eventType)}
                      </h3>
                      <time className="text-sm text-slate-500">
                        {formatDate(event.createdAt)}
                      </time>
                    </div>
                    {event.comment ? (
                      <p className="text-sm text-slate-600">{event.comment}</p>
                    ) : null}
                    <p className="break-all font-mono text-xs text-slate-500">
                      Actor: {event.actorUserId ?? "system"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-5">
                <p className="text-sm text-slate-600">
                  No review events are recorded yet.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Add note
              </h2>
            </div>
            <form action={addReviewCaseNoteAction} className="space-y-4 p-5">
              <input name="caseId" type="hidden" value={reviewCase.id} />
              <textarea
                className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                disabled={!canModify}
                maxLength={2000}
                name="comment"
                placeholder={
                  canModify
                    ? "Add a reviewer note"
                    : "Assign the case or use an admin role to add notes"
                }
                required
              />
              <button
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canModify}
                type="submit"
              >
                Add note
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Case details
              </h2>
            </div>
            <dl className="space-y-3 p-5 text-sm">
              <MetadataItem label="Reviewer" value={reviewCase.assignedReviewerEmail ?? "Unassigned"} />
              <MetadataItem label="Created" value={formatDate(reviewCase.createdAt)} />
              <MetadataItem label="Updated" value={formatDate(reviewCase.updatedAt)} />
              <MetadataItem label="Case ID" value={reviewCase.id} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Set status
              </h2>
            </div>
            <div className="space-y-2 p-5">
              {REVIEW_ACTION_STATUSES.map((status) => {
                const isAllowed =
                  canModify &&
                  isAllowedReviewStatusTransition(reviewCase.status, status);

                return (
                  <form action={setReviewCaseStatusAction} key={status}>
                    <input name="caseId" type="hidden" value={reviewCase.id} />
                    <input name="status" type="hidden" value={status} />
                    <button
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      disabled={!isAllowed}
                      type="submit"
                    >
                      {status}
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function MetadataItem({
  label,
  value
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="font-medium text-slate-800">{label}</dt>
      <dd className="mt-1 break-all text-slate-600">{value}</dd>
    </div>
  );
}

function formatEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
