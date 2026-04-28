import { getDatabase, schema, type Database } from "../../lib/db";
import type { RbacUser } from "../../lib/rbac/guards";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

type TenantOptionsServiceOptions = {
  database?: Database;
};

export async function listSubmissionCreateTenantOptions(
  user: RbacUser,
  options: TenantOptionsServiceOptions = {}
): Promise<TenantOption[]> {
  if (user.role !== "SUPER_ADMIN") {
    return [];
  }

  const db = options.database ?? getDatabase();

  return db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name,
      slug: schema.tenants.slug
    })
    .from(schema.tenants)
    .orderBy(schema.tenants.name);
}
