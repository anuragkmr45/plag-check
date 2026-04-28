import { describe, expect, it } from "vitest";
import {
  REQUIRED_AUDIT_ACTIONS,
  parseAuditLogFilters,
  resolveAuditScope
} from "../src/features/audit/audit.service";
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

describe("audit service", () => {
  it("tracks all audit actions required by P7-T3", () => {
    expect(REQUIRED_AUDIT_ACTIONS).toEqual(
      expect.arrayContaining([
        "auth.login",
        "auth.logout",
        "user.create",
        "user.role.update",
        "user.deactivate",
        "submission.create",
        "submission.file.upload",
        "submission.extract",
        "submission.preprocess",
        "submission.scan.queued",
        "submission.scan.completed",
        "report.pdf.generated",
        "review_case.note_added",
        "review_case.status_changed",
        "tenant.settings.update",
        "support_ticket.status_changed"
      ])
    );
  });

  it("scopes audit log access to super admins and tenant admins", () => {
    expect(resolveAuditScope(superAdmin)).toEqual({
      isGlobal: true,
      tenantId: null
    });
    expect(resolveAuditScope(institutionAdmin)).toEqual({
      isGlobal: false,
      tenantId
    });
    expect(() => resolveAuditScope(reviewer)).toThrow(AuthorizationError);
  });

  it("parses safe audit filters", () => {
    const filters = parseAuditLogFilters({
      action: " submission.create ",
      actorUserId: "00000000-0000-4000-8000-000000000021",
      entityType: " submission ",
      from: "2026-04-01",
      to: "2026-04-30"
    });

    expect(filters).toMatchObject({
      action: "submission.create",
      actorUserId: "00000000-0000-4000-8000-000000000021",
      entityType: "submission"
    });
    expect(filters.from?.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(filters.to?.toISOString()).toBe("2026-04-30T00:00:00.000Z");
  });

  it("rejects invalid actor filter values", () => {
    expect(() =>
      parseAuditLogFilters({
        actorUserId: "not-a-uuid"
      })
    ).toThrow();
  });
});
