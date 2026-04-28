import type { AdminAnalytics } from "./analytics.service";

export type BarChartRow = {
  label: string;
  value: number;
};

export function formatMetricNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

export function formatUsagePercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

export function calculateBarPercent(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return Number(Math.min(100, (value / maxValue) * 100).toFixed(2));
}

export function buildSubmissionStatusRows(
  analytics: Pick<AdminAnalytics, "submissionsByStatus">
): BarChartRow[] {
  return Object.entries(analytics.submissionsByStatus)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      label: formatLabel(status),
      value
    }))
    .sort(sortRows);
}

export function buildUserRoleRows(
  analytics: Pick<AdminAnalytics, "usersByRole">
): BarChartRow[] {
  return Object.entries(analytics.usersByRole)
    .filter(([, value]) => value > 0)
    .map(([role, value]) => ({
      label: formatLabel(role),
      value
    }))
    .sort(sortRows);
}

function sortRows(left: BarChartRow, right: BarChartRow): number {
  return right.value - left.value || left.label.localeCompare(right.label);
}

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
