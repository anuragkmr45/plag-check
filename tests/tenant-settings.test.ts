import { describe, expect, it } from "vitest";
import { AuthorizationError, type RbacUser } from "../src/lib/rbac/guards";
import {
  DEFAULT_TENANT_SETTINGS,
  assertCanEditTenantSettings,
  buildTenantSettingsJson,
  normalizeTenantSettings,
  tenantSettingsInputSchema
} from "../src/features/tenants/tenant-settings.service";

const tenantId = "00000000-0000-4000-8000-000000000001";

const institutionAdmin = {
  id: "00000000-0000-4000-8000-000000000011",
  isActive: true,
  role: "INSTITUTION_ADMIN",
  tenantId
} satisfies RbacUser;

const superAdmin = {
  id: "00000000-0000-4000-8000-000000000012",
  isActive: true,
  role: "SUPER_ADMIN",
  tenantId: null
} satisfies RbacUser;

describe("tenant settings", () => {
  it("normalizes empty settings to safe defaults", () => {
    expect(normalizeTenantSettings(null)).toEqual(DEFAULT_TENANT_SETTINGS);
    expect(normalizeTenantSettings({})).toEqual(DEFAULT_TENANT_SETTINGS);
  });

  it("reads canonical nested settings and repository reuse consent", () => {
    expect(
      normalizeTenantSettings({
        branding: {
          logoStorageKey: "tenant-assets/logo.png",
          logoUrl: "https://example.test/logo.png",
          primaryColor: "#334455",
          reportFooter: "Institution footer"
        },
        limits: {
          maxFileSizeMb: 10,
          monthlyWordLimit: 500000,
          smallMatchWordThreshold: 8,
          submissionLimit: 120
        },
        repository: {
          allowReuse: true,
          requireUserConsentForRepository: true
        },
        retention: {
          retainOriginalFilesDays: 180,
          retainReportsDays: 730
        }
      })
    ).toMatchObject({
      allowRepositoryReuse: true,
      logoStorageKey: "tenant-assets/logo.png",
      logoUrl: "https://example.test/logo.png",
      maxFileSizeBytes: 10 * 1024 * 1024,
      monthlyWordLimit: 500000,
      primaryColor: "#334455",
      requireUserConsentForRepository: true,
      retainOriginalFilesDays: 180,
      retainReportsDays: 730,
      reportFooter: "Institution footer",
      smallMatchWordThreshold: 8,
      submissionLimit: 120
    });
  });

  it("serializes form input with compatibility keys used by services", () => {
    const input = tenantSettingsInputSchema.parse({
      allowRepositoryReuse: false,
      logoStorageKey: "",
      logoUrl: "https://example.test/logo.png",
      maxFileSizeMb: "15",
      monthlyWordLimit: "750000",
      primaryColor: "#ABCDEF",
      requireUserConsentForRepository: true,
      retainOriginalFilesDays: "365",
      retainReportsDays: "730",
      reportFooter: "Footer",
      smallMatchWordThreshold: "6",
      submissionLimit: "200"
    });
    const settingsJson = buildTenantSettingsJson(input);

    expect(input.primaryColor).toBe("#abcdef");
    expect(settingsJson).toMatchObject({
      allowRepositoryReuse: false,
      logoUrl: "https://example.test/logo.png",
      maxFileSizeBytes: 15 * 1024 * 1024,
      monthlyWordLimit: 750000,
      monthlyWordLimitWords: 750000,
      primaryColor: "#abcdef",
      requireUserConsentForRepository: true,
      require_user_consent_for_repository: true,
      retainOriginalFilesDays: 365,
      retainReportsDays: 730,
      retain_original_files_days: 365,
      retain_reports_days: 730,
      reportFooter: "Footer",
      smallMatchWordThreshold: 6,
      submissionLimit: 200
    });
    expect(settingsJson.branding).toMatchObject({
      logoStorageKey: null,
      logoUrl: "https://example.test/logo.png",
      primaryColor: "#abcdef",
      reportFooter: "Footer"
    });
    expect(settingsJson.limits).toMatchObject({
      maxFileSizeMb: 15,
      monthlyWordLimit: 750000,
      smallMatchWordThreshold: 6,
      submissionLimit: 200
    });
    expect(settingsJson.repository).toMatchObject({
      allowReuse: false,
      requireUserConsent: true,
      requireUserConsentForRepository: true
    });
    expect(settingsJson.retention).toMatchObject({
      retainOriginalFilesDays: 365,
      retainReportsDays: 730
    });
  });

  it("allows only institution admins to edit their tenant settings", () => {
    expect(assertCanEditTenantSettings(institutionAdmin)).toBe(tenantId);
    expect(assertCanEditTenantSettings(superAdmin, tenantId)).toBe(tenantId);
    expect(() =>
      assertCanEditTenantSettings({
        ...institutionAdmin,
        role: "REVIEWER"
      })
    ).toThrow(AuthorizationError);
    expect(() => assertCanEditTenantSettings(superAdmin)).toThrow(
      AuthorizationError
    );
  });
});
