import {
  listAuditEvents,
  parseAuditLogFilters,
  type AuditEventListItem,
  type AuditLogView
} from "../../../../features/audit/audit.service";
import { getRequiredSessionWithRole } from "../../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../../lib/rbac/roles";

type AdminAuditPageProps = {
  searchParams?: Promise<{
    action?: string;
    actorUserId?: string;
    entityType?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminAuditPage({
  searchParams
}: AdminAuditPageProps): Promise<React.JSX.Element> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const params = searchParams ? await searchParams : {};
  const filters = parseAuditLogFilters(params);
  const auditLog = await listAuditEvents(session.user, filters);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-600">
          {auditLog.scope.isGlobal ? "All tenants" : "Your tenant"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Audit log
        </h1>
      </div>

      <AuditFilters auditLog={auditLog} />
      <AuditTable events={auditLog.events} />
    </section>
  );
}

function AuditFilters({
  auditLog
}: {
  auditLog: AuditLogView;
}): React.JSX.Element {
  return (
    <form
      action="/admin/audit"
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-5"
    >
      <Field label="Action" name="action">
        <select
          className={inputClassName}
          defaultValue={auditLog.filters.action ?? ""}
          id="action"
          name="action"
        >
          <option value="">All actions</option>
          {auditLog.actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Entity" name="entityType">
        <input
          className={inputClassName}
          defaultValue={auditLog.filters.entityType ?? ""}
          id="entityType"
          maxLength={120}
          name="entityType"
          placeholder="submission"
        />
      </Field>
      <Field label="Actor user ID" name="actorUserId">
        <input
          className={inputClassName}
          defaultValue={auditLog.filters.actorUserId ?? ""}
          id="actorUserId"
          name="actorUserId"
          placeholder="UUID"
        />
      </Field>
      <Field label="From" name="from">
        <input
          className={inputClassName}
          defaultValue={formatDateInput(auditLog.filters.from)}
          id="from"
          name="from"
          type="date"
        />
      </Field>
      <Field label="To" name="to">
        <input
          className={inputClassName}
          defaultValue={formatDateInput(auditLog.filters.to)}
          id="to"
          name="to"
          type="date"
        />
      </Field>
      <div className="flex items-end gap-2 lg:col-span-5">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          type="submit"
        >
          Apply filters
        </button>
        <a
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/admin/audit"
        >
          Clear
        </a>
      </div>
    </form>
  );
}

function AuditTable({
  events
}: {
  events: AuditEventListItem[];
}): React.JSX.Element {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          No audit events match the current filters.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-4 align-top text-slate-600">
                  {formatDate(event.createdAt)}
                </td>
                <td className="px-4 py-4 align-top font-medium text-slate-950">
                  {event.action}
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  <p>{event.actorEmail ?? "System"}</p>
                  {event.actorUserId ? (
                    <p className="mt-1 break-all font-mono text-xs">
                      {event.actorUserId}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  <p>{event.tenantName ?? "Global"}</p>
                  {event.tenantId ? (
                    <p className="mt-1 break-all font-mono text-xs">
                      {event.tenantId}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  <p>{event.entityType}</p>
                  {event.entityId ? (
                    <p className="mt-1 break-all font-mono text-xs">
                      {event.entityId}
                    </p>
                  ) : null}
                </td>
                <td className="max-w-sm px-4 py-4 align-top">
                  <pre className="max-h-32 overflow-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDateInput(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

const inputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
