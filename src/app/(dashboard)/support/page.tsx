import Link from "next/link";
import {
  canCreateSupportTicket,
  listSupportTickets,
  type SupportTicketSummary
} from "../../../features/support/support.service";
import { getRequiredSession } from "../../../lib/auth/server";
import { createSupportTicketAction } from "./actions";

type SupportPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function SupportPage({
  searchParams
}: SupportPageProps): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const [tickets, params]: [
    SupportTicketSummary[],
    Awaited<NonNullable<SupportPageProps["searchParams"]>>
  ] = await Promise.all([
    listSupportTickets(session.user),
    searchParams ? searchParams : Promise.resolve({})
  ]);
  const canCreate = canCreateSupportTicket(session.user);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-600">
          {session.user.role === "SUPER_ADMIN" ? "All tenants" : "Support desk"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Support tickets
        </h1>
      </div>

      {params.created ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Support ticket created.
        </div>
      ) : null}

      {canCreate ? <CreateTicketForm /> : null}
      <TicketList tickets={tickets} />
    </section>
  );
}

function CreateTicketForm(): React.JSX.Element {
  return (
    <form
      action={createSupportTicketAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-950">Create ticket</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Field label="Subject" name="title">
          <input
            className={inputClassName}
            id="title"
            maxLength={200}
            minLength={3}
            name="title"
            required
          />
        </Field>
        <Field label="Details" name="description">
          <textarea
            className={inputClassName}
            id="description"
            maxLength={4000}
            name="description"
            required
            rows={3}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          type="submit"
        >
          Create ticket
        </button>
      </div>
    </form>
  );
}

function TicketList({
  tickets
}: {
  tickets: SupportTicketSummary[];
}): React.JSX.Element {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">No support tickets are available.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Tickets</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <li className="px-5 py-4" key={ticket.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="font-medium text-slate-950 underline-offset-4 hover:underline"
                  href={`/support/${ticket.id}`}
                >
                  {ticket.title}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {ticket.tenantName} - created by {ticket.createdByEmail}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {ticket.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-slate-500">
                  Updated {formatDate(ticket.updatedAt)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({
  children,
  label,
  name
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      {children}
    </div>
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

const inputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
