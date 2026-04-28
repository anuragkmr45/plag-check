import { LogoutButton } from "../auth/logout-button";
import type { AuthenticatedUser } from "../../server/services/auth.service";
import { getNavigationItems } from "../../lib/rbac/navigation";
import type { EditableTenantSettings } from "../../features/tenants/tenant-settings.service";
import { TenantBrandMark } from "../../features/tenants/tenant-brand-mark";
import { DashboardNavigation } from "./dashboard-navigation";

type DashboardShellProps = {
  branding: EditableTenantSettings | null;
  children: React.ReactNode;
  user: AuthenticatedUser;
};

export function DashboardShell({
  branding,
  children,
  user
}: DashboardShellProps): React.JSX.Element {
  const navigationItems = getNavigationItems(user);
  const brandLabel = branding?.tenant.name ?? "Plagcheck";
  const primaryColor =
    branding?.settings.primaryColor ?? "var(--pc-teal)";

  return (
    <div className="pc-app-bg min-h-screen text-slate-950">
      <div className="flex min-h-screen">
        <aside className="pc-sidebar sticky top-0 hidden h-screen w-64 overflow-y-auto border-r border-teal-950/40 px-5 py-6 md:block">
          <div className="rounded-lg border border-white/10 bg-white/8 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <TenantBrandMark
                label={brandLabel}
                logoUrl={branding?.settings.logoUrl ?? null}
                primaryColor={primaryColor}
              />
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-white">
                  {brandLabel}
                </div>
                <div className="pc-sidebar-muted mt-0.5 text-xs">Plagcheck</div>
              </div>
            </div>
          </div>
          <DashboardNavigation items={navigationItems} variant="desktop" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="pc-header border-b border-teal-900/10 px-4 py-4 shadow-sm sm:px-6"
            style={{ borderTop: `4px solid ${primaryColor}` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="md:hidden">
                  <TenantBrandMark
                    label={brandLabel}
                    logoUrl={branding?.settings.logoUrl ?? null}
                    primaryColor={primaryColor}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {user.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {user.role}
                    {branding ? ` - ${branding.tenant.name}` : ""}
                  </p>
                </div>
              </div>
              <LogoutButton />
            </div>
            <DashboardNavigation items={navigationItems} variant="mobile" />
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
