import { describe, expect, it } from "vitest";
import { AuthorizationError, type RbacUser } from "../src/lib/rbac/guards";
import type { UserRole } from "../src/lib/rbac/roles";
import {
  canUseSubmissionForRepository,
  getSubmissionCreateTenantId,
  getSubmissionScope,
  hasRepositoryReuseConsent
} from "../src/server/services/submissions.service";

const tenantId = "00000000-0000-4000-8000-000000000001";
const otherTenantId = "00000000-0000-4000-8000-000000000002";

function user(role: UserRole, overrides: Partial<RbacUser> = {}): RbacUser {
  return {
    id: `user-${role.toLowerCase()}`,
    isActive: true,
    role,
    tenantId: role === "SUPER_ADMIN" ? null : tenantId,
    ...overrides
  };
}

describe("submission RBAC scope", () => {
  it("allows super admins to use a global view or an explicit tenant filter", () => {
    expect(getSubmissionScope(user("SUPER_ADMIN"))).toEqual({
      isGlobal: true
    });
    expect(
      getSubmissionScope(user("SUPER_ADMIN"), {
        tenantId
      })
    ).toEqual({
      isGlobal: false,
      tenantId
    });
  });

  it("scopes tenant staff to their own tenant", () => {
    expect(getSubmissionScope(user("INSTITUTION_ADMIN"))).toEqual({
      isGlobal: false,
      tenantId
    });
    expect(getSubmissionScope(user("REVIEWER"))).toEqual({
      isGlobal: false,
      tenantId
    });
  });

  it("scopes users to their own tenant and own submissions", () => {
    expect(getSubmissionScope(user("USER"))).toEqual({
      createdByUserId: "user-user",
      isGlobal: false,
      tenantId
    });
  });

  it("requires tenant IDs for tenant-scoped users and super-admin creation", () => {
    expect(() => getSubmissionScope(user("USER", { tenantId: null }))).toThrow(
      AuthorizationError
    );
    expect(() => getSubmissionCreateTenantId(user("SUPER_ADMIN"))).toThrow(
      AuthorizationError
    );
    expect(getSubmissionCreateTenantId(user("SUPER_ADMIN"), otherTenantId)).toBe(
      otherTenantId
    );
    expect(getSubmissionCreateTenantId(user("USER"), otherTenantId)).toBe(
      tenantId
    );
  });

  it("requires tenant repository policy and submission-level consent before reuse", () => {
    const consentMetadata = {
      repositoryReuseConsentAt: new Date("2026-04-28T00:00:00.000Z"),
      repositoryReuseConsentBy: "00000000-0000-4000-8000-000000000012"
    };
    const missingConsent = {
      repositoryReuseConsentAt: null,
      repositoryReuseConsentBy: null
    };

    expect(hasRepositoryReuseConsent(consentMetadata)).toBe(true);
    expect(hasRepositoryReuseConsent(missingConsent)).toBe(false);
    expect(
      canUseSubmissionForRepository(
        {
          allowRepositoryReuse: false,
          requireUserConsentForRepository: true
        },
        consentMetadata
      )
    ).toBe(false);
    expect(
      canUseSubmissionForRepository(
        {
          allowRepositoryReuse: true,
          requireUserConsentForRepository: true
        },
        missingConsent
      )
    ).toBe(false);
    expect(
      canUseSubmissionForRepository(
        {
          allowRepositoryReuse: true,
          requireUserConsentForRepository: false
        },
        consentMetadata
      )
    ).toBe(false);
    expect(
      canUseSubmissionForRepository(
        {
          allowRepositoryReuse: true,
          requireUserConsentForRepository: true
        },
        consentMetadata
      )
    ).toBe(true);
  });
});
