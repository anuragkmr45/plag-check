import { afterEach, describe, expect, it, vi } from "vitest";
import type { EnvInput } from "../src/lib/env";
import type { RbacUser } from "../src/lib/rbac/guards";

const validEnv = {
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://plagcheck:local-password@localhost:5432/plagcheck",
  MINIO_ACCESS_KEY: "local-minio-access-key",
  MINIO_BUCKET: "plagcheck-documents",
  MINIO_ENDPOINT: "http://localhost:9000",
  MINIO_REGION: "us-east-1",
  MINIO_SECRET_KEY: "local-minio-secret-key",
  SESSION_SECRET: "local-session-secret-at-least-32-characters"
} satisfies EnvInput;

const tenantId = "00000000-0000-4000-8000-000000000001";
const otherTenantId = "00000000-0000-4000-8000-000000000002";

async function loadUserManagementService() {
  vi.resetModules();

  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value);
  }

  return import("../src/features/users/user-management.service");
}

function actor(overrides: Partial<RbacUser> = {}): RbacUser {
  return {
    id: "00000000-0000-4000-8000-000000000011",
    isActive: true,
    role: "INSTITUTION_ADMIN",
    tenantId,
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("user management rules", () => {
  it("allows managed tenant roles and excludes SUPER_ADMIN from create inputs", async () => {
    const { MANAGED_USER_ROLES, parseCreateManagedUserFormData } =
      await loadUserManagementService();

    expect(MANAGED_USER_ROLES).toEqual([
      "INSTITUTION_ADMIN",
      "REVIEWER",
      "USER"
    ]);

    const formData = new FormData();
    formData.set("email", "New.User@Example.edu");
    formData.set("password", "temporary-pass");
    formData.set("role", "USER");

    expect(parseCreateManagedUserFormData(formData)).toMatchObject({
      email: "new.user@example.edu",
      role: "USER"
    });

    formData.set("role", "SUPER_ADMIN");
    expect(() => parseCreateManagedUserFormData(formData)).toThrow();
  });

  it("scopes institution admin user creation to their tenant", async () => {
    const { getCreateUserTenantId } = await loadUserManagementService();

    expect(getCreateUserTenantId(actor())).toBe(tenantId);
    expect(getCreateUserTenantId(actor(), tenantId)).toBe(tenantId);
    expect(() => getCreateUserTenantId(actor(), otherTenantId)).toThrow(
      "Cannot create users outside your tenant"
    );
  });

  it("requires super admins to choose a tenant for created tenant users", async () => {
    const { UserManagementValidationError, getCreateUserTenantId } =
      await loadUserManagementService();
    const superAdmin = actor({
      role: "SUPER_ADMIN",
      tenantId: null
    });

    expect(getCreateUserTenantId(superAdmin, otherTenantId)).toBe(otherTenantId);
    expect(() => getCreateUserTenantId(superAdmin)).toThrow(
      UserManagementValidationError
    );
  });

  it("allows admins to manage tenant users without crossing tenant boundaries", async () => {
    const { canManageUser } = await loadUserManagementService();

    expect(
      canManageUser(actor(), {
        id: "target",
        role: "USER",
        tenantId
      })
    ).toBe(true);
    expect(
      canManageUser(actor(), {
        id: "target",
        role: "USER",
        tenantId: otherTenantId
      })
    ).toBe(false);
    expect(
      canManageUser(actor({ role: "SUPER_ADMIN", tenantId: null }), {
        id: "target",
        role: "INSTITUTION_ADMIN",
        tenantId
      })
    ).toBe(true);
    expect(
      canManageUser(actor({ role: "SUPER_ADMIN", tenantId: null }), {
        id: "target",
        role: "SUPER_ADMIN",
        tenantId: null
      })
    ).toBe(false);
  });
});
