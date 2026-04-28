import { describe, expect, it } from "vitest";
import { resolveAnalyticsScope } from "../src/features/analytics/analytics.service";
import { canManageUser } from "../src/features/users/user-management.service";
import { AuthorizationError, type RbacUser } from "../src/lib/rbac/guards";
import { buildTenantStorageKey } from "../src/lib/storage/object-storage";
import {
  getSubmissionScope,
  type SubmissionScope,
  type SubmissionSummary
} from "../src/server/services/submissions.service";

const tenantAId = "00000000-0000-4000-8000-0000000000a1";
const tenantBId = "00000000-0000-4000-8000-0000000000b1";
const tenantAUserId = "00000000-0000-4000-8000-0000000000a2";
const tenantAAdminId = "00000000-0000-4000-8000-0000000000a3";
const tenantAReviewerId = "00000000-0000-4000-8000-0000000000a4";
const tenantBUserId = "00000000-0000-4000-8000-0000000000b2";

const tenantAUser = rbacUser({
  id: tenantAUserId,
  role: "USER",
  tenantId: tenantAId
});
const tenantAAdmin = rbacUser({
  id: tenantAAdminId,
  role: "INSTITUTION_ADMIN",
  tenantId: tenantAId
});
const tenantAReviewer = rbacUser({
  id: tenantAReviewerId,
  role: "REVIEWER",
  tenantId: tenantAId
});

const tenantBSubmission = submission({
  createdByUserId: tenantBUserId,
  id: "00000000-0000-4000-8000-0000000000b3",
  tenantId: tenantBId
});

describe("P7 tenant isolation", () => {
  it("prevents a tenant A user from listing tenant B submissions", () => {
    const scope = getSubmissionScope(tenantAUser);

    expect(scopeAllowsSubmission(scope, tenantBSubmission)).toBe(false);
  });

  it("prevents a tenant A reviewer from opening a tenant B report", () => {
    const reportSubmissionScope = getSubmissionScope(tenantAReviewer);

    expect(scopeAllowsSubmission(reportSubmissionScope, tenantBSubmission)).toBe(
      false
    );
  });

  it("prevents a tenant A admin from managing tenant B users", () => {
    expect(
      canManageUser(tenantAAdmin, {
        id: tenantBUserId,
        role: "USER",
        tenantId: tenantBId
      })
    ).toBe(false);
  });

  it("builds tenant-scoped storage keys", () => {
    const key = buildTenantStorageKey(
      tenantAId,
      "00000000-0000-4000-8000-0000000000a5",
      "paper.txt"
    );

    expect(key).toBe(
      `tenants/${tenantAId}/submissions/00000000-0000-4000-8000-0000000000a5/paper.txt`
    );
    expect(key).not.toContain(tenantBId);
  });

  it("prevents a tenant A admin from requesting tenant B analytics", () => {
    expect(resolveAnalyticsScope(tenantAAdmin)).toEqual({
      isGlobal: false,
      tenantId: tenantAId
    });
    expect(() => resolveAnalyticsScope(tenantAAdmin, tenantBId)).toThrow(
      AuthorizationError
    );
  });
});

function rbacUser(input: {
  id: string;
  role: RbacUser["role"];
  tenantId: string | null;
}): RbacUser {
  return {
    id: input.id,
    isActive: true,
    role: input.role,
    tenantId: input.tenantId
  };
}

function submission(
  input: Pick<SubmissionSummary, "createdByUserId" | "id" | "tenantId">
): SubmissionSummary {
  const now = new Date("2026-04-28T00:00:00.000Z");

  return {
    assignedReviewerId: null,
    createdAt: now,
    createdByUserId: input.createdByUserId,
    id: input.id,
    metadata: {},
    repositoryReuseConsentAt: null,
    repositoryReuseConsentBy: null,
    status: "SCAN_COMPLETE",
    tenantId: input.tenantId,
    title: "Tenant B submission",
    updatedAt: now,
    wordCount: 100
  };
}

function scopeAllowsSubmission(
  scope: SubmissionScope,
  item: Pick<SubmissionSummary, "createdByUserId" | "tenantId">
): boolean {
  if (scope.tenantId && scope.tenantId !== item.tenantId) {
    return false;
  }

  if (scope.createdByUserId && scope.createdByUserId !== item.createdByUserId) {
    return false;
  }

  return scope.isGlobal || Boolean(scope.tenantId);
}
