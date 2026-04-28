"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "../../lib/rbac/navigation";

type DashboardNavigationProps = {
  items: NavigationItem[];
  variant: "desktop" | "mobile";
};

export function DashboardNavigation({
  items,
  variant
}: DashboardNavigationProps): React.JSX.Element {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
        {items.map((item) => {
          const active = isActiveNavigationItem(pathname, item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-teal-200 bg-white text-teal-950 hover:border-teal-500 hover:bg-teal-50"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-8 space-y-1">
      {items.map((item) => {
        const active = isActiveNavigationItem(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-white/14 text-white shadow-sm ring-1 ring-white/15"
                : "text-teal-50/78 hover:bg-white/10 hover:text-white"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isActiveNavigationItem(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
