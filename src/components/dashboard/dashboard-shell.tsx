import Link from "next/link";
import { LogoutButton } from "../auth/logout-button";
import type { AuthenticatedUser } from "../../server/services/auth.service";
import { getNavigationItems } from "../../lib/rbac/navigation";
import type { EditableTenantSettings } from "../../features/tenants/tenant-settings.service";
import { TenantBrandMark } from "../../features/tenants/tenant-brand-mark";

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
    branding?.settings.primaryColor ?? "var(--color-slate-950)";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white px-5 py-6 md:block">
          <div className="flex items-center gap-3">
            <TenantBrandMark
              label={brandLabel}
              logoUrl={branding?.settings.logoUrl ?? null}
              primaryColor={primaryColor}
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{brandLabel}</div>
              <div className="mt-0.5 text-xs text-slate-500">Plagcheck</div>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navigationItems.map((item) => (
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6"
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
                  <p className="mt-1 text-xs text-slate-500">
                    {user.role}
                    {branding ? ` - ${branding.tenant.name}` : ""}
                  </p>
                </div>
              </div>
              <LogoutButton />
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
              {navigationItems.map((item) => (
                <Link
                  className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
