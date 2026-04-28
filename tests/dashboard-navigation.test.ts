import { describe, expect, it } from "vitest";
import { getNavigationItems } from "../src/lib/rbac/navigation";
import type { UserRole } from "../src/lib/rbac/roles";

function labelsFor(role: UserRole): string[] {
  return getNavigationItems({
    role
  }).map((item) => item.label);
}

describe("dashboard navigation", () => {
  it("shows global and tenant admin links to super admins", () => {
    expect(labelsFor("SUPER_ADMIN")).toEqual([
      "Dashboard",
      "Submissions",
      "New Check",
      "Reports",
      "Plagiarism",
      "AI Detector",
      "Grammar",
      "Reviewer Queue",
      "Users",
      "Settings",
      "Audit",
      "Support"
    ]);
  });

  it("shows tenant administration links to institution admins", () => {
    expect(labelsFor("INSTITUTION_ADMIN")).toEqual([
      "Dashboard",
      "Submissions",
      "New Check",
      "Reports",
      "Plagiarism",
      "AI Detector",
      "Grammar",
      "Reviewer Queue",
      "Users",
      "Settings",
      "Audit",
      "Support"
    ]);
  });

  it("shows review links to reviewers without admin settings", () => {
    expect(labelsFor("REVIEWER")).toEqual([
      "Dashboard",
      "Submissions",
      "New Check",
      "Reports",
      "Plagiarism",
      "AI Detector",
      "Grammar",
      "Reviewer Queue",
      "Support"
    ]);
  });

  it("shows only dashboard and submissions links to users", () => {
    expect(labelsFor("USER")).toEqual([
      "Dashboard",
      "Submissions",
      "New Check",
      "Reports",
      "Plagiarism",
      "AI Detector",
      "Grammar",
      "Support"
    ]);
  });
});
