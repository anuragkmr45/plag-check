"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createManagedUser,
  parseCreateManagedUserFormData,
  parseResetManagedUserPasswordFormData,
  parseSetManagedUserActiveFormData,
  parseUpdateManagedUserRoleFormData,
  resetManagedUserPassword,
  setManagedUserActive,
  updateManagedUserRole
} from "../../../../features/users/user-management.service";
import { getRequiredSessionWithRole } from "../../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../../lib/rbac/roles";

export async function createManagedUserAction(formData: FormData): Promise<void> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const input = parseCreateManagedUserFormData(formData);

  await createManagedUser(session.user, input);
  revalidatePath("/admin/users");
  redirect("/admin/users?created=1");
}

export async function updateManagedUserRoleAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const input = parseUpdateManagedUserRoleFormData(formData);

  await updateManagedUserRole(session.user, input);
  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function setManagedUserActiveAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const input = parseSetManagedUserActiveFormData(formData);

  await setManagedUserActive(session.user, input);
  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function resetManagedUserPasswordAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const input = parseResetManagedUserPasswordFormData(formData);

  await resetManagedUserPassword(session.user, input);
  revalidatePath("/admin/users");
  redirect("/admin/users?password_reset=1");
}
