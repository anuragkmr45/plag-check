import { hasRole, type RbacUser } from "./guards";
import {
  REVIEW_ROLES,
  SUBMISSION_OWNER_ROLES,
  TENANT_ADMIN_ROLES,
  type UserRole
} from "./roles";

export type NavigationItem = {
  href: string;
  label: string;
  roles: readonly UserRole[];
};

export const DASHBOARD_NAVIGATION_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/submissions",
    label: "Submissions",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/scan/new",
    label: "New Check",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/reports",
    label: "Reports",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/plagiarism-checker",
    label: "Plagiarism",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/ai-detector",
    label: "AI Detector",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/grammar-checker",
    label: "Grammar",
    roles: SUBMISSION_OWNER_ROLES
  },
  {
    href: "/reviewer/queue",
    label: "Reviewer Queue",
    roles: REVIEW_ROLES
  },
  {
    href: "/admin/users",
    label: "Users",
    roles: TENANT_ADMIN_ROLES
  },
  {
    href: "/admin/settings",
    label: "Settings",
    roles: TENANT_ADMIN_ROLES
  },
  {
    href: "/admin/audit",
    label: "Audit",
    roles: TENANT_ADMIN_ROLES
  },
  {
    href: "/support",
    label: "Support",
    roles: SUBMISSION_OWNER_ROLES
  }
] as const satisfies readonly NavigationItem[];

export function getNavigationItems(user: Pick<RbacUser, "role">): NavigationItem[] {
  return DASHBOARD_NAVIGATION_ITEMS.filter((item) => hasRole(user, item.roles));
}
