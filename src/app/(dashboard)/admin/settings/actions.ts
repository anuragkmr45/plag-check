"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseTenantSettingsFormData,
  updateTenantSettings
} from "../../../../features/tenants/tenant-settings.service";
import { getRequiredSessionWithRole } from "../../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../../lib/rbac/roles";

export async function updateTenantSettingsAction(
  formData: FormData
): Promise<void> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const input = parseTenantSettingsFormData(formData);

  await updateTenantSettings(session.user, input);
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/submissions");
  redirect("/admin/settings?saved=1");
}
