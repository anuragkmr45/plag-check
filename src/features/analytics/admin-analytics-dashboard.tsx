import type { AdminAnalytics } from "./analytics.service";
import {
  buildSubmissionStatusRows,
  buildUserRoleRows,
  calculateBarPercent,
  formatMetricNumber,
  formatUsagePercent,
  type BarChartRow
} from "./analytics-view";

type AdminAnalyticsDashboardProps = {
  analytics: AdminAnalytics;
};

export function AdminAnalyticsDashboard({
  analytics
}: AdminAnalyticsDashboardProps): React.JSX.Element {
  const statusRows = buildSubmissionStatusRows(analytics);
  const roleRows = buildUserRoleRows(analytics);
  const highRiskCount =
    analytics.highSimilarityCount + analytics.highAiProbabilityCount;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-600">
          {analytics.scope.isGlobal ? "Global summary" : "Tenant summary"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Metrics generated {formatDate(analytics.generatedAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accentClassName="border-l-emerald-500"
          label="Submissions"
          value={formatMetricNumber(analytics.totalSubmissions)}
        />
        <MetricCard
          accentClassName="border-l-sky-500"
          label="Words processed this month"
          value={formatMetricNumber(analytics.wordsProcessedThisMonth)}
        />
        <MetricCard
          accentClassName="border-l-violet-500"
          label="Scans completed this month"
          value={formatMetricNumber(analytics.scansCompletedThisMonth)}
        />
        <MetricCard
          accentClassName="border-l-rose-500"
          label="High-risk submissions"
          value={formatMetricNumber(highRiskCount)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <SectionHeader
            description="Current submission distribution by workflow status."
            title="Submissions by status"
          />
          <BarChart
            emptyMessage="No submissions are available for this scope."
            rows={statusRows}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <SectionHeader
            description="Active and inactive users are included by role."
            title="Users by role"
          />
          <BarChart
            emptyMessage="No users are available for this scope."
            rows={roleRows}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <SectionHeader
            description="Usage is measured against tenant limits or global tenant limit totals."
            title="Monthly usage"
          />
          <div className="space-y-5 p-5">
            <UsageMeter
              label="Words processed"
              limit={analytics.usage.monthlyWordLimit}
              percent={analytics.usage.wordUsagePercent}
              used={analytics.usage.wordsProcessedThisMonth}
            />
            <UsageMeter
              label="Submissions"
              limit={analytics.usage.submissionLimit}
              percent={analytics.usage.submissionUsagePercent}
              used={analytics.usage.submissionsUsed}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <SectionHeader title="Risk thresholds" />
          <dl className="space-y-3 p-5 text-sm">
            <MetadataItem
              label="High similarity"
              value={`${analytics.thresholds.highSimilarity}% or higher`}
            />
            <MetadataItem
              label="High AI probability"
              value={formatUsagePercent(analytics.thresholds.highAiProbability * 100)}
            />
            <MetadataItem
              label="High similarity count"
              value={formatMetricNumber(analytics.highSimilarityCount)}
            />
            <MetadataItem
              label="High AI count"
              value={formatMetricNumber(analytics.highAiProbabilityCount)}
            />
          </dl>
        </section>
      </div>

      {analytics.featureBudgets.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white">
          <SectionHeader
            description="Remaining monthly feature capacity for this demo workspace."
            title="Feature capacity"
          />
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            {analytics.featureBudgets.map((budget) => (
              <FeatureBudgetCard budget={budget} key={budget.featureKey} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function MetricCard({
  accentClassName,
  label,
  value
}: {
  accentClassName: string;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <section
      className={`rounded-lg border border-l-4 border-slate-200 bg-white p-5 ${accentClassName}`}
    >
      <h2 className="text-sm font-medium text-slate-600">{label}</h2>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}

function SectionHeader({
  description,
  title
}: {
  description?: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function BarChart({
  emptyMessage,
  rows
}: {
  emptyMessage: string;
  rows: BarChartRow[];
}): React.JSX.Element {
  const maxValue = Math.max(0, ...rows.map((row) => row.value));

  if (rows.length === 0) {
    return (
      <div className="p-5">
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4 p-5" role="list">
      {rows.map((row) => {
        const percent = calculateBarPercent(row.value, maxValue);

        return (
          <li className="space-y-2" key={row.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{row.label}</span>
              <span className="text-slate-600">{formatMetricNumber(row.value)}</span>
            </div>
            <div
              aria-label={`${row.label}: ${row.value}`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              className="h-2 rounded-full bg-slate-100"
              role="meter"
            >
              <div
                className="h-2 rounded-full bg-slate-900"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function UsageMeter({
  label,
  limit,
  percent,
  used
}: {
  label: string;
  limit: number;
  percent: number;
  used: number;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <h3 className="font-medium text-slate-800">{label}</h3>
        <p className="text-slate-600">
          {formatMetricNumber(used)} / {formatMetricNumber(limit)}
        </p>
      </div>
      <div
        aria-label={`${label}: ${formatUsagePercent(percent)} used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="h-3 rounded-full bg-slate-100"
        role="meter"
      >
        <div
          className="h-3 rounded-full bg-emerald-600"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {formatUsagePercent(percent)} used
      </p>
    </div>
  );
}

function FeatureBudgetCard({
  budget
}: {
  budget: AdminAnalytics["featureBudgets"][number];
}): React.JSX.Element {
  const barClassName = budget.critical
    ? "bg-rose-600"
    : budget.warning
      ? "bg-amber-500"
      : "bg-emerald-600";

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {budget.featureLabel}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Resets {formatDate(budget.resetAt)}
          </p>
        </div>
        {budget.critical || budget.warning ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              budget.critical
                ? "bg-rose-100 text-rose-900"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {budget.critical ? "Critical" : "Low"}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-950">
        {formatMetricNumber(budget.remaining)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        remaining of {formatMetricNumber(budget.limit)} {budget.unitLabel}
      </p>
      <div
        aria-label={`${budget.featureLabel}: ${formatUsagePercent(
          budget.percentUsed
        )} used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={budget.percentUsed}
        className="mt-4 h-2 rounded-full bg-slate-100"
        role="meter"
      >
        <div
          className={`h-2 rounded-full ${barClassName}`}
          style={{ width: `${budget.percentUsed}%` }}
        />
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
      <dd className="mt-1 text-slate-600">{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
