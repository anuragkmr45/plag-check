import Link from "next/link";
import { getTenantFeatureBudgets } from "../../../../features/budgets/feature-budget.service";
import { getEditableTenantSettings } from "../../../../features/tenants/tenant-settings.service";
import { listSubmissionCreateTenantOptions } from "../../../../features/tenants/tenant-options.service";
import { getRequiredSessionWithRole } from "../../../../lib/auth/server";
import { TENANT_ADMIN_ROLES } from "../../../../lib/rbac/roles";
import { updateTenantSettingsAction } from "./actions";

type AdminSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    tenantId?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams
}: AdminSettingsPageProps): Promise<React.JSX.Element> {
  const session = await getRequiredSessionWithRole(TENANT_ADMIN_ROLES);
  const tenantOptions = await listSubmissionCreateTenantOptions(session.user);
  const params = searchParams ? await searchParams : {};
  const selectedTenantId =
    session.user.role === "SUPER_ADMIN"
      ? params.tenantId ?? tenantOptions[0]?.id
      : session.user.tenantId ?? undefined;
  const editableSettings = await getEditableTenantSettings(session.user, {
    tenantId: selectedTenantId
  });
  const saved = params.saved === "1";

  if (!editableSettings) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tenant settings are editable by institution admins.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            Sign in as an institution admin to update tenant branding and usage
            limits.
          </p>
        </div>
      </section>
    );
  }

  const { settings, tenant } = editableSettings;
  const featureBudgets = await getTenantFeatureBudgets(tenant.id);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-600">{tenant.name}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Tenant settings
        </h1>
      </div>

      {tenantOptions.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Tenant selector
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tenantOptions.map((option) => (
              <Link
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  option.id === tenant.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
                href={`/admin/settings?tenantId=${option.id}`}
                key={option.id}
              >
                {option.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Settings saved.
        </div>
      ) : null}

      <form
        action={updateTenantSettingsAction}
        className="space-y-6 rounded-lg border border-slate-200 bg-white p-5"
      >
        <input name="tenantId" type="hidden" value={tenant.id} />
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Branding</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Logo URL" name="logoUrl">
              <input
                className={inputClassName}
                defaultValue={settings.logoUrl ?? ""}
                id="logoUrl"
                maxLength={2048}
                name="logoUrl"
                placeholder="https://example.edu/logo.png"
                type="url"
              />
            </Field>
            <Field label="Logo storage key" name="logoStorageKey">
              <input
                className={inputClassName}
                defaultValue={settings.logoStorageKey ?? ""}
                id="logoStorageKey"
                maxLength={512}
                name="logoStorageKey"
                placeholder="tenant-assets/logo.png"
                type="text"
              />
            </Field>
            <Field label="Primary color" name="primaryColor">
              <input
                className="h-11 w-24 rounded-md border border-slate-300 bg-white p-1"
                defaultValue={settings.primaryColor}
                id="primaryColor"
                name="primaryColor"
                type="color"
              />
            </Field>
            <Field label="Report footer" name="reportFooter">
              <textarea
                className={`${inputClassName} min-h-28`}
                defaultValue={settings.reportFooter ?? ""}
                id="reportFooter"
                maxLength={1000}
                name="reportFooter"
                rows={4}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Feature budgets
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Monthly feature limits protect demo capacity while preserving
              local fallback behavior.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureBudgets.map((budget) => (
              <Field
                key={budget.featureKey}
                label={budget.featureLabel}
                name={`budget_${budget.featureKey}`}
              >
                <input
                  className={inputClassName}
                  defaultValue={budget.limit}
                  id={`budget_${budget.featureKey}`}
                  min={1}
                  name={`budget_${budget.featureKey}`}
                  step={1}
                  type="number"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {budget.remaining.toLocaleString("en")} remaining this month
                </p>
              </Field>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Usage and processing
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Max file size (MB)" name="maxFileSizeMb">
              <input
                className={inputClassName}
                defaultValue={settings.maxFileSizeMb}
                id="maxFileSizeMb"
                min={1}
                name="maxFileSizeMb"
                step={1}
                type="number"
              />
            </Field>
            <Field label="Monthly word limit" name="monthlyWordLimit">
              <input
                className={inputClassName}
                defaultValue={settings.monthlyWordLimit}
                id="monthlyWordLimit"
                min={1}
                name="monthlyWordLimit"
                step={1}
                type="number"
              />
            </Field>
            <Field label="Submission limit" name="submissionLimit">
              <input
                className={inputClassName}
                defaultValue={settings.submissionLimit}
                id="submissionLimit"
                min={1}
                name="submissionLimit"
                step={1}
                type="number"
              />
            </Field>
            <Field label="Small match threshold" name="smallMatchWordThreshold">
              <input
                className={inputClassName}
                defaultValue={settings.smallMatchWordThreshold}
                id="smallMatchWordThreshold"
                min={1}
                name="smallMatchWordThreshold"
                step={1}
                type="number"
              />
            </Field>
            <Field
              label="Original file retention (days)"
              name="retainOriginalFilesDays"
            >
              <input
                className={inputClassName}
                defaultValue={settings.retainOriginalFilesDays}
                id="retainOriginalFilesDays"
                min={1}
                name="retainOriginalFilesDays"
                step={1}
                type="number"
              />
            </Field>
            <Field label="Report retention (days)" name="retainReportsDays">
              <input
                className={inputClassName}
                defaultValue={settings.retainReportsDays}
                id="retainReportsDays"
                min={1}
                name="retainReportsDays"
                step={1}
                type="number"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Repository consent
            </h2>
          </div>
          <label className="flex items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
            <input
              className="mt-1 h-4 w-4 rounded border-slate-300"
              defaultChecked={settings.allowRepositoryReuse}
              name="allowRepositoryReuse"
              type="checkbox"
            />
            <span>
              Allow submitted content to be reused in the institutional
              repository when consent requirements are satisfied.
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
            <input
              className="mt-1 h-4 w-4 rounded border-slate-300"
              defaultChecked={settings.requireUserConsentForRepository}
              name="requireUserConsentForRepository"
              type="checkbox"
            />
            <span>
              Require submission-level user consent before repository reuse.
            </span>
          </label>
        </section>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
}

const inputClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function Field({
  children,
  label,
  name
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      {children}
    </div>
  );
}
