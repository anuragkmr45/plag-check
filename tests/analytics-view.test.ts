import { describe, expect, it } from "vitest";
import {
  buildSubmissionStatusRows,
  buildUserRoleRows,
  calculateBarPercent,
  formatMetricNumber,
  formatUsagePercent
} from "../src/features/analytics/analytics-view";
import type { AdminAnalytics } from "../src/features/analytics/analytics.service";

const analytics = {
  submissionsByStatus: {
    CLEARED: 0,
    DRAFT: 0,
    ESCALATED: 0,
    EXTRACTING: 0,
    FAILED: 1,
    HOLD: 0,
    READY_FOR_SCAN: 0,
    SCAN_COMPLETE: 3,
    SCANNING: 0,
    SCAN_QUEUED: 0,
    UNDER_REVIEW: 0,
    UPLOADED: 2
  },
  usersByRole: {
    INSTITUTION_ADMIN: 1,
    REVIEWER: 2,
    SUPER_ADMIN: 0,
    USER: 4
  }
} satisfies Pick<AdminAnalytics, "submissionsByStatus" | "usersByRole">;

describe("analytics view helpers", () => {
  it("formats metric and usage values for dashboard display", () => {
    expect(formatMetricNumber(12000)).toBe("12,000");
    expect(formatUsagePercent(12.345)).toBe("12.35%");
    expect(calculateBarPercent(25, 100)).toBe(25);
    expect(calculateBarPercent(150, 100)).toBe(100);
    expect(calculateBarPercent(10, 0)).toBe(0);
  });

  it("builds sorted dashboard rows without zero-value noise", () => {
    expect(buildSubmissionStatusRows(analytics)).toEqual([
      { label: "Scan Complete", value: 3 },
      { label: "Uploaded", value: 2 },
      { label: "Failed", value: 1 }
    ]);
    expect(buildUserRoleRows(analytics)).toEqual([
      { label: "User", value: 4 },
      { label: "Reviewer", value: 2 },
      { label: "Institution Admin", value: 1 }
    ]);
  });
});
