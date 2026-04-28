import { describe, expect, it } from "vitest";
import {
  DEFAULT_MONTHLY_WORD_LIMIT,
  DEFAULT_SUBMISSION_LIMIT,
  buildSubmissionStatusCounts,
  buildUserRoleCounts,
  calculateUsagePercent,
  getUtcMonthStart,
  resolveAnalyticsScope,
  resolveUsageLimitsFromSettings
} from "../src/features/analytics/analytics.service";
import { AuthorizationError, type RbacUser } from "../src/lib/rbac/guards";

const tenantId = "00000000-0000-4000-8000-000000000001";

const institutionAdmin = {
  id: "00000000-0000-4000-8000-000000000011",
  isActive: true,
  role: "INSTITUTION_ADMIN",
  tenantId
} satisfies RbacUser;

const superAdmin = {
  ...institutionAdmin,
  id: "00000000-0000-4000-8000-000000000012",
  role: "SUPER_ADMIN",
  tenantId: null
} satisfies RbacUser;

const reviewer = {
  ...institutionAdmin,
  id: "00000000-0000-4000-8000-000000000013",
  role: "REVIEWER"
} satisfies RbacUser;

describe("analytics service helpers", () => {
  it("resolves analytics scope for institution admins and super admins", () => {
    expect(resolveAnalyticsScope(institutionAdmin)).toEqual({
      isGlobal: false,
      tenantId
    });
    expect(resolveAnalyticsScope(institutionAdmin, tenantId)).toEqual({
      isGlobal: false,
      tenantId
    });
    expect(resolveAnalyticsScope(superAdmin)).toEqual({
      isGlobal: true,
      tenantId: null
    });
    expect(resolveAnalyticsScope(superAdmin, tenantId)).toEqual({
      isGlobal: false,
      tenantId
    });
    expect(() =>
      resolveAnalyticsScope(
        institutionAdmin,
        "00000000-0000-4000-8000-000000000099"
      )
    ).toThrow(AuthorizationError);
    expect(() => resolveAnalyticsScope(reviewer)).toThrow(AuthorizationError);
  });

  it("resolves usage limits from tenant settings with safe defaults", () => {
    expect(resolveUsageLimitsFromSettings(null)).toEqual({
      monthlyWordLimit: DEFAULT_MONTHLY_WORD_LIMIT,
      submissionLimit: DEFAULT_SUBMISSION_LIMIT
    });
    expect(
      resolveUsageLimitsFromSettings({
        monthlyWordLimit: 2000,
        submissionLimit: 25
      })
    ).toEqual({
      monthlyWordLimit: 2000,
      submissionLimit: 25
    });
    expect(
      resolveUsageLimitsFromSettings({
        monthlyWordLimitWords: 3000
      })
    ).toEqual({
      monthlyWordLimit: 3000,
      submissionLimit: DEFAULT_SUBMISSION_LIMIT
    });
    expect(
      resolveUsageLimitsFromSettings({
        limits: {
          monthlyWordLimit: 4000,
          submissionLimit: 40
        }
      })
    ).toEqual({
      monthlyWordLimit: 4000,
      submissionLimit: 40
    });
  });

  it("builds complete status and role maps with zero defaults", () => {
    const statuses = buildSubmissionStatusCounts([
      {
        count: 2,
        status: "SCAN_COMPLETE"
      },
      {
        count: 1,
        status: "FAILED"
      }
    ]);
    const roles = buildUserRoleCounts([
      {
        count: 1,
        role: "INSTITUTION_ADMIN"
      },
      {
        count: 3,
        role: "USER"
      }
    ]);

    expect(statuses.SCAN_COMPLETE).toBe(2);
    expect(statuses.FAILED).toBe(1);
    expect(statuses.UPLOADED).toBe(0);
    expect(roles.INSTITUTION_ADMIN).toBe(1);
    expect(roles.USER).toBe(3);
    expect(roles.SUPER_ADMIN).toBe(0);
  });

  it("calculates usage percentages and UTC month starts", () => {
    expect(calculateUsagePercent(25, 100)).toBe(25);
    expect(calculateUsagePercent(150, 100)).toBe(100);
    expect(calculateUsagePercent(10, 0)).toBe(0);
    expect(getUtcMonthStart(new Date("2026-04-28T10:20:00.000Z")).toISOString()).toBe(
      "2026-04-01T00:00:00.000Z"
    );
  });
});
