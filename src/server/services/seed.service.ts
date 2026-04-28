import { sql } from "drizzle-orm";
import { hashPassword } from "../../lib/auth/password";
import { getDatabase, schema, type Database } from "../../lib/db";
import type { SeedEnv } from "../../lib/env";
import type { UserRole } from "../../lib/rbac/roles";

const demoTenant = {
  name: "Demo Institution",
  slug: "demo-institution"
};

const demoUsers = [
  {
    email: "admin@demo.plagcheck.local",
    role: "INSTITUTION_ADMIN"
  },
  {
    email: "reviewer@demo.plagcheck.local",
    role: "REVIEWER"
  },
  {
    email: "user@demo.plagcheck.local",
    role: "USER"
  }
] as const satisfies readonly {
  email: string;
  role: UserRole;
}[];

export type SeededUser = {
  email: string;
  id: string;
  role: UserRole;
  tenantId: string | null;
};

export type SeedResult = {
  demoTenant: {
    id: string;
    name: string;
    slug: string;
  };
  users: SeededUser[];
};

type SeedOptions = {
  database?: Database;
};

function getSeedDatabase(options?: SeedOptions): Database {
  return options?.database ?? getDatabase();
}

async function upsertUser(
  db: Database,
  user: {
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId: string | null;
  }
): Promise<SeededUser> {
  const [seededUser] = await db
    .insert(schema.users)
    .values({
      email: user.email,
      isActive: true,
      passwordHash: user.passwordHash,
      role: user.role,
      tenantId: user.tenantId
    })
    .onConflictDoUpdate({
      set: {
        isActive: true,
        passwordHash: user.passwordHash,
        role: user.role,
        tenantId: user.tenantId,
        updatedAt: sql`now()`
      },
      target: schema.users.email
    })
    .returning({
      email: schema.users.email,
      id: schema.users.id,
      role: schema.users.role,
      tenantId: schema.users.tenantId
    });

  return seededUser;
}

export async function seedDatabase(
  seedEnv: SeedEnv,
  options?: SeedOptions
): Promise<SeedResult> {
  const db = getSeedDatabase(options);
  const [tenant] = await db
    .insert(schema.tenants)
    .values(demoTenant)
    .onConflictDoUpdate({
      set: {
        name: demoTenant.name,
        updatedAt: sql`now()`
      },
      target: schema.tenants.slug
    })
    .returning({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug
    });

  await db
    .insert(schema.tenantSettings)
    .values({
      settings: {},
      tenantId: tenant.id
    })
    .onConflictDoUpdate({
      set: {
        settings: {},
        updatedAt: sql`now()`
      },
      target: schema.tenantSettings.tenantId
    });

  const superAdminPasswordHash = await hashPassword(
    seedEnv.SEED_SUPER_ADMIN_PASSWORD
  );
  const demoPasswordHash = await hashPassword(
    seedEnv.SEED_DEMO_USER_PASSWORD ?? seedEnv.SEED_SUPER_ADMIN_PASSWORD
  );

  const users = [
    await upsertUser(db, {
      email: seedEnv.SEED_SUPER_ADMIN_EMAIL,
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      tenantId: null
    }),
    ...(await Promise.all(
      demoUsers.map((demoUser) =>
        upsertUser(db, {
          email: demoUser.email,
          passwordHash: demoPasswordHash,
          role: demoUser.role,
          tenantId: tenant.id
        })
      )
    ))
  ];

  return {
    demoTenant: tenant,
    users
  };
}
