import { describe, expect, it } from "vitest";
import {
  canAssignReviewCaseToSelf,
  canModifyReviewCase,
  isAllowedReviewStatusTransition,
  type ReviewCaseSummary
} from "../src/features/review/review.service";
import type { RbacUser } from "../src/lib/rbac/guards";

const tenantId = "00000000-0000-4000-8000-000000000001";
const reviewer = {
  id: "00000000-0000-4000-8000-000000000011",
  isActive: true,
  role: "REVIEWER",
  tenantId
} satisfies RbacUser;
const otherReviewer = {
  ...reviewer,
  id: "00000000-0000-4000-8000-000000000012"
} satisfies RbacUser;
const admin = {
  ...reviewer,
  id: "00000000-0000-4000-8000-000000000013",
  role: "INSTITUTION_ADMIN"
} satisfies RbacUser;
const superAdmin = {
  ...reviewer,
  id: "00000000-0000-4000-8000-000000000014",
  role: "SUPER_ADMIN",
  tenantId: null
} satisfies RbacUser;

const reviewCase = {
  assignedReviewerEmail: null,
  assignedReviewerId: null,
  createdAt: new Date("2026-04-28T00:00:00.000Z"),
  finalDecision: null,
  id: "00000000-0000-4000-8000-000000000021",
  status: "OPEN",
  submission: {
    id: "00000000-0000-4000-8000-000000000031",
    status: "SCAN_COMPLETE",
    title: "Paper"
  },
  tenantId,
  updatedAt: new Date("2026-04-28T00:00:00.000Z")
} satisfies ReviewCaseSummary;

describe("review service permissions and transitions", () => {
  it("allows reviewers to self-assign only open unassigned tenant cases", () => {
    expect(canAssignReviewCaseToSelf(reviewer, reviewCase)).toBe(true);
    expect(
      canAssignReviewCaseToSelf(admin, {
        ...reviewCase
      })
    ).toBe(false);
    expect(
      canAssignReviewCaseToSelf(reviewer, {
        ...reviewCase,
        assignedReviewerId: otherReviewer.id
      })
    ).toBe(false);
    expect(
      canAssignReviewCaseToSelf(reviewer, {
        ...reviewCase,
        status: "HOLD"
      })
    ).toBe(false);
  });

  it("allows admins and assigned reviewers to modify review cases", () => {
    expect(
      canModifyReviewCase(reviewer, {
        ...reviewCase,
        assignedReviewerId: reviewer.id
      })
    ).toBe(true);
    expect(
      canModifyReviewCase(otherReviewer, {
        ...reviewCase,
        assignedReviewerId: reviewer.id
      })
    ).toBe(false);
    expect(canModifyReviewCase(admin, reviewCase)).toBe(true);
    expect(canModifyReviewCase(superAdmin, reviewCase)).toBe(true);
  });

  it("validates review status transitions", () => {
    expect(isAllowedReviewStatusTransition("OPEN", "HOLD")).toBe(true);
    expect(isAllowedReviewStatusTransition("OPEN", "CLEARED")).toBe(true);
    expect(isAllowedReviewStatusTransition("HOLD", "ESCALATED")).toBe(true);
    expect(isAllowedReviewStatusTransition("HOLD", "HOLD")).toBe(false);
    expect(isAllowedReviewStatusTransition("CLEARED", "ESCALATED")).toBe(false);
    expect(isAllowedReviewStatusTransition("ESCALATED", "CLEARED")).toBe(false);
    expect(isAllowedReviewStatusTransition("UNKNOWN", "HOLD")).toBe(false);
  });
});
