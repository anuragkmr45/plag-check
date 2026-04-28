import { and, asc, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "../../lib/auth/password";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";
import type { UserRole } from "../../lib/rbac/roles";

export const MANAGED_USER_ROLES = [
  "INSTITUTION_ADMIN",
  "REVIEWER",
  "USER"
] as const satisfies readonly UserRole[];

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

export type ManagedUser = {
  createdAt: Date;
  email: string;
  id: string;
  isActive: boolean;
  role: ManagedUserRole;
  tenantId: string;
  tenantName: string;
  updatedAt: Date;
};

export type TenantOption = {
  id: string;
  name: string;
};

export type ManagedUsersView = {
  creatableRoles: readonly ManagedUserRole[];
  scope: {
    isGlobal: boolean;
    tenantId: string | null;
  };
  tenants: TenantOption[];
  users: ManagedUser[];
};

export type CreateManagedUserInput = {
  email: string;
  password: string;
  role: ManagedUserRole;
  tenantId?: string;
};

export type UpdateManagedUserRoleInput = {
  role: ManagedUserRole;
  userId: string;
};

export type SetManagedUserActiveInput = {
  isActive: boolean;
  userId: string;
};

export type ResetManagedUserPasswordInput = {
  password: string;
  userId: string;
};

type UserManagementOptions = {
  database?: Database;
};

const createManagedUserInputSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(200),
  role: z.enum(MANAGED_USER_ROLES),
  tenantId: z.string().uuid().optional()
});

const updateManagedUserRoleInputSchema = z.object({
  role: z.enum(MANAGED_USER_ROLES),
  userId: z.string().uuid()
});

const setManagedUserActiveInputSchema = z.object({
  isActive: z.boolean(),
  userId: z.string().uuid()
});

const resetManagedUserPasswordInputSchema = z.object({
  password: z.string().min(8).max(200),
  userId: z.string().uuid()
});

export class UserManagementValidationError extends Error {
  readonly code = "USER_MANAGEMENT_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "UserManagementValidationError";
  }
}

export class ManagedUserNotFoundError extends Error {
  readonly code = "MANAGED_USER_NOT_FOUND";

  constructor(message = "Managed user not found") {
    super(message);
    this.name = "ManagedUserNotFoundError";
  }
}

export function parseCreateManagedUserFormData(
  formData: FormData
): CreateManagedUserInput {
  return createManagedUserInputSchema.parse({
    email: stringField(formData, "email"),
    password: stringField(formData, "password"),
    role: stringField(formData, "role"),
    tenantId: optionalStringField(formData, "tenantId")
  });
}

export function parseUpdateManagedUserRoleFormData(
  formData: FormData
): UpdateManagedUserRoleInput {
  return updateManagedUserRoleInputSchema.parse({
    role: stringField(formData, "role"),
    userId: stringField(formData, "userId")
  });
}

export function parseSetManagedUserActiveFormData(
  formData: FormData
): SetManagedUserActiveInput {
  return setManagedUserActiveInputSchema.parse({
    isActive: stringField(formData, "isActive") === "true",
    userId: stringField(formData, "userId")
  });
}

export function parseResetManagedUserPasswordFormData(
  formData: FormData
): ResetManagedUserPasswordInput {
  return resetManagedUserPasswordInputSchema.parse({
    password: stringField(formData, "password"),
    userId: stringField(formData, "userId")
  });
}

export function canManageUser(
  actor: RbacUser,
  target: {
    id: string;
    role: UserRole;
    tenantId: string | null;
  }
): boolean {
  if (target.role === "SUPER_ADMIN") {
    return false;
  }

  if (actor.role === "SUPER_ADMIN") {
    return Boolean(target.tenantId);
  }

  return (
    actor.role === "INSTITUTION_ADMIN" &&
    Boolean(actor.tenantId) &&
    actor.tenantId === target.tenantId
  );
}

export function getCreateUserTenantId(
  actor: RbacUser,
  requestedTenantId?: string
): string {
  if (actor.role === "SUPER_ADMIN") {
    if (!requestedTenantId) {
      throw new UserManagementValidationError("Tenant is required");
    }

    return requestedTenantId;
  }

  if (actor.role === "INSTITUTION_ADMIN" && actor.tenantId) {
    if (requestedTenantId && requestedTenantId !== actor.tenantId) {
      throw new AuthorizationError("Cannot create users outside your tenant");
    }

    return actor.tenantId;
  }

  throw new AuthorizationError("User management access denied");
}

export async function listManagedUsers(
  actor: RbacUser,
  options: UserManagementOptions = {}
): Promise<ManagedUsersView> {
  const db = options.database ?? getDatabase();
  const scope = getManagedUsersScope(actor);
  const conditions: SQL[] = [
    isNotNull(schema.users.tenantId),
    sql`${schema.users.role} <> 'SUPER_ADMIN'`
  ];

  if (scope.tenantId) {
    conditions.push(eq(schema.users.tenantId, scope.tenantId));
  }

  const [users, tenants] = await Promise.all([
    db
      .select({
        createdAt: schema.users.createdAt,
        email: schema.users.email,
        id: schema.users.id,
        isActive: schema.users.isActive,
        role: schema.users.role,
        tenantId: schema.users.tenantId,
        tenantName: schema.tenants.name,
        updatedAt: schema.users.updatedAt
      })
      .from(schema.users)
      .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
      .where(and(...conditions))
      .orderBy(asc(schema.tenants.name), asc(schema.users.email)),
    scope.isGlobal ? listTenantOptions(db) : Promise.resolve([])
  ]);

  return {
    creatableRoles: MANAGED_USER_ROLES,
    scope,
    tenants,
    users: users.map((user) => ({
      ...user,
      role: user.role as ManagedUserRole,
      tenantId: user.tenantId ?? ""
    }))
  };
}

export async function createManagedUser(
  actor: RbacUser,
  input: CreateManagedUserInput,
  options: UserManagementOptions = {}
): Promise<ManagedUser> {
  const db = options.database ?? getDatabase();
  const normalizedInput = createManagedUserInputSchema.parse(input);
  const tenantId = getCreateUserTenantId(actor, normalizedInput.tenantId);
  const passwordHash = await hashPassword(normalizedInput.password);

  return db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(sql`lower(${schema.users.email}) = ${normalizedInput.email}`)
      .limit(1);

    if (existingUser) {
      throw new UserManagementValidationError("Email is already in use");
    }

    const [createdUser] = await tx
      .insert(schema.users)
      .values({
        email: normalizedInput.email,
        isActive: true,
        passwordHash,
        role: normalizedInput.role,
        tenantId
      })
      .returning({
        createdAt: schema.users.createdAt,
        email: schema.users.email,
        id: schema.users.id,
        isActive: schema.users.isActive,
        role: schema.users.role,
        tenantId: schema.users.tenantId,
        updatedAt: schema.users.updatedAt
      });

    await tx.insert(schema.auditEvents).values({
      action: "user.create",
      actorUserId: actor.id,
      entityId: createdUser.id,
      entityType: "user",
      metadata: {
        email: createdUser.email,
        role: createdUser.role
      },
      tenantId
    });

    const tenant = await getTenantOptionById(tx, tenantId);

    return toManagedUser(createdUser, tenant);
  });
}

export async function updateManagedUserRole(
  actor: RbacUser,
  input: UpdateManagedUserRoleInput,
  options: UserManagementOptions = {}
): Promise<ManagedUser> {
  const db = options.database ?? getDatabase();
  const normalizedInput = updateManagedUserRoleInputSchema.parse(input);

  return db.transaction(async (tx) => {
    const target = await getTargetManagedUser(tx, actor, normalizedInput.userId);

    const [updatedUser] = await tx
      .update(schema.users)
      .set({
        role: normalizedInput.role,
        updatedAt: sql`now()`
      })
      .where(eq(schema.users.id, target.id))
      .returning({
        createdAt: schema.users.createdAt,
        email: schema.users.email,
        id: schema.users.id,
        isActive: schema.users.isActive,
        role: schema.users.role,
        tenantId: schema.users.tenantId,
        updatedAt: schema.users.updatedAt
      });

    await tx.insert(schema.auditEvents).values({
      action: "user.role.update",
      actorUserId: actor.id,
      entityId: updatedUser.id,
      entityType: "user",
      metadata: {
        fromRole: target.role,
        toRole: normalizedInput.role
      },
      tenantId: target.tenantId
    });

    const tenant = await getTenantOptionById(tx, target.tenantId);

    return toManagedUser(updatedUser, tenant);
  });
}

export async function setManagedUserActive(
  actor: RbacUser,
  input: SetManagedUserActiveInput,
  options: UserManagementOptions = {}
): Promise<ManagedUser> {
  const db = options.database ?? getDatabase();
  const normalizedInput = setManagedUserActiveInputSchema.parse(input);

  if (actor.id === normalizedInput.userId && !normalizedInput.isActive) {
    throw new UserManagementValidationError("Cannot deactivate your own account");
  }

  return db.transaction(async (tx) => {
    const target = await getTargetManagedUser(tx, actor, normalizedInput.userId);

    const [updatedUser] = await tx
      .update(schema.users)
      .set({
        isActive: normalizedInput.isActive,
        updatedAt: sql`now()`
      })
      .where(eq(schema.users.id, target.id))
      .returning({
        createdAt: schema.users.createdAt,
        email: schema.users.email,
        id: schema.users.id,
        isActive: schema.users.isActive,
        role: schema.users.role,
        tenantId: schema.users.tenantId,
        updatedAt: schema.users.updatedAt
      });

    if (!normalizedInput.isActive) {
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, target.id));
    }

    await tx.insert(schema.auditEvents).values({
      action: normalizedInput.isActive ? "user.activate" : "user.deactivate",
      actorUserId: actor.id,
      entityId: updatedUser.id,
      entityType: "user",
      metadata: {
        isActive: normalizedInput.isActive
      },
      tenantId: target.tenantId
    });

    const tenant = await getTenantOptionById(tx, target.tenantId);

    return toManagedUser(updatedUser, tenant);
  });
}

export async function resetManagedUserPassword(
  actor: RbacUser,
  input: ResetManagedUserPasswordInput,
  options: UserManagementOptions = {}
): Promise<void> {
  const db = options.database ?? getDatabase();
  const normalizedInput = resetManagedUserPasswordInputSchema.parse(input);
  const passwordHash = await hashPassword(normalizedInput.password);

  await db.transaction(async (tx) => {
    const target = await getTargetManagedUser(tx, actor, normalizedInput.userId);

    await tx
      .update(schema.users)
      .set({
        passwordHash,
        updatedAt: sql`now()`
      })
      .where(eq(schema.users.id, target.id));

    await tx.delete(schema.sessions).where(eq(schema.sessions.userId, target.id));

    await tx.insert(schema.auditEvents).values({
      action: "user.password.reset",
      actorUserId: actor.id,
      entityId: target.id,
      entityType: "user",
      metadata: {},
      tenantId: target.tenantId
    });
  });
}

function getManagedUsersScope(actor: RbacUser): ManagedUsersView["scope"] {
  if (actor.role === "SUPER_ADMIN") {
    return {
      isGlobal: true,
      tenantId: null
    };
  }

  if (actor.role === "INSTITUTION_ADMIN" && actor.tenantId) {
    return {
      isGlobal: false,
      tenantId: actor.tenantId
    };
  }

  throw new AuthorizationError("User management access denied");
}

async function getTargetManagedUser(
  db: Database,
  actor: RbacUser,
  userId: string
): Promise<ManagedUser> {
  const conditions: SQL[] = [
    eq(schema.users.id, userId),
    isNotNull(schema.users.tenantId),
    sql`${schema.users.role} <> 'SUPER_ADMIN'`
  ];

  if (actor.role !== "SUPER_ADMIN") {
    if (!actor.tenantId) {
      throw new AuthorizationError("User management access denied");
    }

    conditions.push(eq(schema.users.tenantId, actor.tenantId));
  }

  const [target] = await db
    .select({
      createdAt: schema.users.createdAt,
      email: schema.users.email,
      id: schema.users.id,
      isActive: schema.users.isActive,
      role: schema.users.role,
      tenantId: schema.users.tenantId,
      tenantName: schema.tenants.name,
      updatedAt: schema.users.updatedAt
    })
    .from(schema.users)
    .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
    .where(and(...conditions))
    .limit(1);

  if (!target || !canManageUser(actor, target as ManagedUser)) {
    throw new ManagedUserNotFoundError();
  }

  return {
    ...target,
    role: target.role as ManagedUserRole,
    tenantId: target.tenantId ?? ""
  };
}

async function getTenantOptionById(
  db: Database,
  tenantId: string
): Promise<TenantOption> {
  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new UserManagementValidationError("Tenant not found");
  }

  return tenant;
}

async function listTenantOptions(db: Database): Promise<TenantOption[]> {
  return db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name
    })
    .from(schema.tenants)
    .orderBy(asc(schema.tenants.name));
}

function optionalStringField(formData: FormData, name: string): string | undefined {
  const value = stringField(formData, name);

  return value.length > 0 ? value : undefined;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function toManagedUser(
  user: {
    createdAt: Date;
    email: string;
    id: string;
    isActive: boolean;
    role: UserRole;
    tenantId: string | null;
    updatedAt: Date;
  },
  tenant: TenantOption
): ManagedUser {
  if (!user.tenantId || user.role === "SUPER_ADMIN") {
    throw new ManagedUserNotFoundError();
  }

  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    isActive: user.isActive,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: tenant.name,
    updatedAt: user.updatedAt
  };
}
