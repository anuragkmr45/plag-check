import { AdminAnalyticsDashboard } from "../../../features/analytics/admin-analytics-dashboard";
import { getAdminAnalytics } from "../../../features/analytics/analytics.service";
import { getRequiredSession } from "../../../lib/auth/server";
import { hasRole } from "../../../lib/rbac/guards";
import { TENANT_ADMIN_ROLES } from "../../../lib/rbac/roles";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await getRequiredSession();

  if (hasRole(session.user, TENANT_ADMIN_ROLES)) {
    const analytics = await getAdminAnalytics(session.user);

    return <AdminAnalyticsDashboard analytics={analytics} />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Submissions</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">0</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Reviews</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">0</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Reports</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">0</p>
        </div>
      </div>
    </section>
  );
}
