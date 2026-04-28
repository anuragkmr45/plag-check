import { getRequiredSessionWithRole } from "../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../lib/rbac/roles";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);

  return <>{children}</>;
}
