import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  SUPPORT_TICKET_STATUSES,
  canUpdateSupportTicketStatus,
  getSupportTicketDetail,
  type SupportTicketComment,
  type SupportTicketSummary
} from "../../../../features/support/support.service";
import { getRequiredSession } from "../../../../lib/auth/server";
import {
  addSupportTicketCommentAction,
  setSupportTicketStatusAction
} from "../actions";

const ticketIdSchema = z.string().uuid();

type SupportTicketPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    commented?: string;
    created?: string;
    updated?: string;
  }>;
};

export default async function SupportTicketPage({
  params,
  searchParams
}: SupportTicketPageProps): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ? searchParams : Promise.resolve({})
  ]);
  const parsedId = ticketIdSchema.safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const detail = await getSupportTicketDetail(session.user, parsedId.data);

  if (!detail) {
    notFound();
  }

  const canUpdateStatus = canUpdateSupportTicketStatus(
    session.user,
    detail.ticket
  );
  const message = statusMessage(query);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
          href="/support"
        >
          Back to support
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              {detail.ticket.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {detail.ticket.tenantName} - created by{" "}
              {detail.ticket.createdByEmail}
            </p>
          </div>
          <StatusBadge status={detail.ticket.status} />
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Description
              </h2>
            </div>
            <p className="whitespace-pre-wrap p-5 text-sm leading-6 text-slate-700">
              {detail.ticket.description}
            </p>
          </section>

          <CommentsList comments={detail.comments} />
          <AddCommentForm ticketId={detail.ticket.id} />
        </div>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Ticket status
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-800">Status</dt>
                <dd className="mt-1 text-slate-600">
                  {statusLabel(detail.ticket.status)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Created</dt>
                <dd className="mt-1 text-slate-600">
                  {formatDate(detail.ticket.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Updated</dt>
                <dd className="mt-1 text-slate-600">
                  {formatDate(detail.ticket.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Ticket ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-600">
                  {detail.ticket.id}
                </dd>
              </div>
            </dl>
          </div>

          {canUpdateStatus ? (
            <form action={setSupportTicketStatusAction} className="space-y-3">
              <input name="ticketId" type="hidden" value={detail.ticket.id} />
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="status"
              >
                Update status
              </label>
              <select
                className={inputClassName}
                defaultValue=""
                id="status"
                name="status"
                required
              >
                <option value="" disabled>
                  Select status
                </option>
                {SUPPORT_TICKET_STATUSES.filter(
                  (status) => status !== detail.ticket.status
                ).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <button
                className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                type="submit"
              >
                Update status
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function CommentsList({
  comments
}: {
  comments: SupportTicketComment[];
}): React.JSX.Element {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Comments</h2>
      </div>
      {comments.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {comments.map((comment) => (
            <li className="space-y-2 px-5 py-4" key={comment.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-950">
                  {comment.authorEmail}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-5">
          <p className="text-sm text-slate-600">No comments have been added.</p>
        </div>
      )}
    </section>
  );
}

function AddCommentForm({ ticketId }: { ticketId: string }): React.JSX.Element {
  return (
    <form
      action={addSupportTicketCommentAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <input name="ticketId" type="hidden" value={ticketId} />
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="body"
        >
          Add comment
        </label>
        <textarea
          className={inputClassName}
          id="body"
          maxLength={2000}
          name="body"
          required
          rows={4}
        />
      </div>
      <div className="flex justify-end">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          type="submit"
        >
          Add comment
        </button>
      </div>
    </form>
  );
}

function StatusBadge({
  status
}: {
  status: SupportTicketSummary["status"];
}): React.JSX.Element {
  return (
    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
      {statusLabel(status)}
    </span>
  );
}

function statusLabel(status: SupportTicketSummary["status"]): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function statusMessage(params: {
  commented?: string;
  created?: string;
  updated?: string;
}): string | null {
  if (params.created) {
    return "Support ticket created.";
  }

  if (params.commented) {
    return "Comment added.";
  }

  if (params.updated) {
    return "Ticket status updated.";
  }

  return null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

const inputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
