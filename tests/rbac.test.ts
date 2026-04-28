import { describe, expect, it, vi } from "vitest";
import {
  assertSameTenant,
  AuthenticationRequiredError,
  AuthorizationError,
  hasRole,
  requireAuth,
  requireRole,
  requireTenantAccess,
  type RbacUser
} from "../src/lib/rbac/guards";
import {
  GLOBAL_ADMIN_ROLES,
  isUserRole,
  REVIEW_ROLES,
  SUBMISSION_OWNER_ROLES,
  TENANT_ADMIN_ROLES,
  USER_ROLES,
  type UserRole
} from "../src/lib/rbac/roles";
import type { ValidatedSession } from "../src/server/services/auth.service";

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

describe("RBAC roles", () => {
  it("defines exactly the canonical roles", () => {
    expect(USER_ROLES).toEqual([
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "REVIEWER",
      "USER"
    ]);
    expect(isUserRole("SUPER_ADMIN")).toBe(true);
    expect(isUserRole("OWNER")).toBe(false);
  });

  it("checks role membership explicitly for every role group", () => {
    expect(hasRole(user("SUPER_ADMIN"), GLOBAL_ADMIN_ROLES)).toBe(true);
    expect(hasRole(user("INSTITUTION_ADMIN"), GLOBAL_ADMIN_ROLES)).toBe(false);

    expect(hasRole(user("SUPER_ADMIN"), TENANT_ADMIN_ROLES)).toBe(true);
    expect(hasRole(user("INSTITUTION_ADMIN"), TENANT_ADMIN_ROLES)).toBe(true);
    expect(hasRole(user("REVIEWER"), TENANT_ADMIN_ROLES)).toBe(false);
    expect(hasRole(user("USER"), TENANT_ADMIN_ROLES)).toBe(false);

    expect(hasRole(user("SUPER_ADMIN"), REVIEW_ROLES)).toBe(true);
    expect(hasRole(user("INSTITUTION_ADMIN"), REVIEW_ROLES)).toBe(true);
    expect(hasRole(user("REVIEWER"), REVIEW_ROLES)).toBe(true);
    expect(hasRole(user("USER"), REVIEW_ROLES)).toBe(false);

    expect(hasRole(user("SUPER_ADMIN"), SUBMISSION_OWNER_ROLES)).toBe(true);
    expect(hasRole(user("INSTITUTION_ADMIN"), SUBMISSION_OWNER_ROLES)).toBe(
      true
    );
    expect(hasRole(user("REVIEWER"), SUBMISSION_OWNER_ROLES)).toBe(true);
    expect(hasRole(user("USER"), SUBMISSION_OWNER_ROLES)).toBe(true);
    expect(hasRole(null, SUBMISSION_OWNER_ROLES)).toBe(false);
  });
});

describe("RBAC guards", () => {
  it("requires an authenticated session", async () => {
    const validSession = {
      session: {
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        expiresAt: new Date("2030-01-08T00:00:00.000Z"),
        id: "session-id",
        userId: "user-id"
      },
      user: {
        email: "admin@example.edu",
        id: "user-id",
        isActive: true,
        role: "INSTITUTION_ADMIN",
        tenantId
      }
    } satisfies ValidatedSession;
    const request = new Request("http://localhost/dashboard");
    const getCurrentUser = vi.fn().mockResolvedValue(validSession);

    await expect(
      requireAuth(request, {
        getCurrentUser
      })
    ).resolves.toBe(validSession);
    expect(getCurrentUser).toHaveBeenCalledWith(request);

    await expect(
      requireAuth(request, {
        getCurrentUser: vi.fn().mockResolvedValue(null)
      })
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it("requires one of the allowed roles", () => {
    const requireTenantAdmin = requireRole(TENANT_ADMIN_ROLES);

    expect(requireTenantAdmin(user("SUPER_ADMIN")).role).toBe("SUPER_ADMIN");
    expect(requireTenantAdmin(user("INSTITUTION_ADMIN")).role).toBe(
      "INSTITUTION_ADMIN"
    );
    expect(() => requireTenantAdmin(user("REVIEWER"))).toThrow(
      AuthorizationError
    );
    expect(() => requireTenantAdmin(user("USER"))).toThrow(AuthorizationError);
  });

  it("allows super admins across tenants and keeps tenant users scoped", () => {
    expect(() => assertSameTenant(user("SUPER_ADMIN"), otherTenantId)).not.toThrow();
    expect(() =>
      assertSameTenant(user("INSTITUTION_ADMIN"), tenantId)
    ).not.toThrow();
    expect(() => assertSameTenant(user("REVIEWER"), tenantId)).not.toThrow();
    expect(() => assertSameTenant(user("USER"), tenantId)).not.toThrow();

    expect(() => assertSameTenant(user("INSTITUTION_ADMIN"), otherTenantId)).toThrow(
      AuthorizationError
    );
    expect(() => assertSameTenant(user("REVIEWER"), null)).toThrow(
      AuthorizationError
    );
    expect(() =>
      assertSameTenant(user("USER", { tenantId: null }), tenantId)
    ).toThrow(AuthorizationError);
  });

  it("builds reusable tenant access guards", () => {
    const requireCurrentTenant = requireTenantAccess(tenantId);

    expect(requireCurrentTenant(user("USER")).id).toBe("user-user");
    expect(() => requireCurrentTenant(user("USER", { tenantId: otherTenantId })))
      .toThrow(AuthorizationError);
  });
});
