export const USER_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "REVIEWER",
  "USER"
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const GLOBAL_ADMIN_ROLES = ["SUPER_ADMIN"] as const satisfies readonly UserRole[];
export const TENANT_ADMIN_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN"
] as const satisfies readonly UserRole[];
export const REVIEW_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "REVIEWER"
] as const satisfies readonly UserRole[];
export const SUBMISSION_OWNER_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "REVIEWER",
  "USER"
] as const satisfies readonly UserRole[];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
