import { DashboardShell } from "../../components/dashboard/dashboard-shell";
import { getDashboardTenantBranding } from "../../features/tenants/tenant-settings.service";
import { getRequiredSession } from "../../lib/auth/server";

export default async function ProtectedDashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const { user } = await getRequiredSession();
  const branding = await getDashboardTenantBranding(user);

  return (
    <DashboardShell branding={branding} user={user}>
      {children}
    </DashboardShell>
  );
}
