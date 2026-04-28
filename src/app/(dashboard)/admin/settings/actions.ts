"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseFeatureBudgetLimitFormData,
  upsertTenantFeatureBudgetLimits
} from "../../../../features/budgets/feature-budget.service";
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
  const targetTenantId = getOptionalString(formData, "tenantId");
  const budgetLimits = parseFeatureBudgetLimitFormData(formData);

  const updated = await updateTenantSettings(session.user, input, {
    tenantId: targetTenantId ?? undefined
  });

  if (budgetLimits.length > 0) {
    await upsertTenantFeatureBudgetLimits(updated.tenant.id, budgetLimits);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/submissions");
  redirect(`/admin/settings?saved=1&tenantId=${updated.tenant.id}`);
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : null;
}
