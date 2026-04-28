import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";

const bytesPerMegabyte = 1024 * 1024;

export const DEFAULT_TENANT_SETTINGS = {
  allowRepositoryReuse: false,
  logoStorageKey: null,
  logoUrl: null,
  maxFileSizeBytes: 25 * bytesPerMegabyte,
  maxFileSizeMb: 25,
  monthlyWordLimit: 1_000_000,
  primaryColor: "#0f172a",
  requireUserConsentForRepository: true,
  retainOriginalFilesDays: 365,
  retainReportsDays: 365,
  reportFooter: null,
  smallMatchWordThreshold: 14,
  submissionLimit: 300
} as const satisfies TenantSettings;

export type TenantSettings = {
  allowRepositoryReuse: boolean;
  logoStorageKey: string | null;
  logoUrl: string | null;
  maxFileSizeBytes: number;
  maxFileSizeMb: number;
  monthlyWordLimit: number;
  primaryColor: string;
  requireUserConsentForRepository: boolean;
  retainOriginalFilesDays: number;
  retainReportsDays: number;
  reportFooter: string | null;
  smallMatchWordThreshold: number;
  submissionLimit: number;
};

export type EditableTenantSettings = {
  settings: TenantSettings;
  tenant: {
    id: string;
    name: string;
  };
};

type TenantSettingsServiceOptions = {
  database?: Database;
  tenantId?: string;
};

const optionalHttpUrlSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "Logo URL must use http or https"
    })
    .nullable()
);

const optionalTextSchema = (maxLength: number) =>
  z.preprocess(emptyStringToNull, z.string().trim().max(maxLength).nullable());

export const tenantSettingsInputSchema = z.object({
  allowRepositoryReuse: z.boolean().default(false),
  logoStorageKey: optionalTextSchema(512),
  logoUrl: optionalHttpUrlSchema,
  maxFileSizeMb: z.coerce.number().positive().max(250),
  monthlyWordLimit: z.coerce.number().int().positive().max(100_000_000),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .transform((value) => value.toLowerCase()),
  requireUserConsentForRepository: z.boolean().default(true),
  retainOriginalFilesDays: z.coerce.number().int().positive().max(3650),
  retainReportsDays: z.coerce.number().int().positive().max(3650),
  reportFooter: optionalTextSchema(1000),
  smallMatchWordThreshold: z.coerce.number().int().positive().max(1000),
  submissionLimit: z.coerce.number().int().positive().max(1_000_000)
});

export type TenantSettingsInput = z.infer<typeof tenantSettingsInputSchema>;

export function parseTenantSettingsFormData(
  formData: FormData
): TenantSettingsInput {
  return tenantSettingsInputSchema.parse({
    allowRepositoryReuse: formData.get("allowRepositoryReuse") === "on",
    logoStorageKey: stringField(formData, "logoStorageKey"),
    logoUrl: stringField(formData, "logoUrl"),
    maxFileSizeMb: stringField(formData, "maxFileSizeMb"),
    monthlyWordLimit: stringField(formData, "monthlyWordLimit"),
    primaryColor: stringField(formData, "primaryColor"),
    requireUserConsentForRepository:
      formData.get("requireUserConsentForRepository") === "on",
    retainOriginalFilesDays: stringField(formData, "retainOriginalFilesDays"),
    retainReportsDays: stringField(formData, "retainReportsDays"),
    reportFooter: stringField(formData, "reportFooter"),
    smallMatchWordThreshold: stringField(formData, "smallMatchWordThreshold"),
    submissionLimit: stringField(formData, "submissionLimit")
  });
}

export function normalizeTenantSettings(settings: unknown): TenantSettings {
  const root = asRecord(settings);
  const branding = asRecord(root.branding);
  const limits = asRecord(root.limits);
  const preprocessing = asRecord(root.preprocessing);
  const repository = asRecord(root.repository);
  const retention = asRecord(root.retention);
  const maxFileSizeMb = positiveNumberSetting(
    DEFAULT_TENANT_SETTINGS.maxFileSizeMb,
    limits.maxFileSizeMb,
    root.maxFileSizeMb
  );
  const maxFileSizeBytes = positiveIntegerSetting(
    Math.floor(maxFileSizeMb * bytesPerMegabyte),
    limits.maxFileSizeBytes,
    root.maxFileSizeBytes
  );

  return {
    allowRepositoryReuse: booleanSetting(
      DEFAULT_TENANT_SETTINGS.allowRepositoryReuse,
      repository.allowReuse,
      root.allowRepositoryReuse
    ),
    logoStorageKey: textSetting(branding.logoStorageKey, root.logoStorageKey),
    logoUrl: textSetting(branding.logoUrl, root.logoUrl),
    maxFileSizeBytes,
    maxFileSizeMb: Number((maxFileSizeBytes / bytesPerMegabyte).toFixed(2)),
    monthlyWordLimit: positiveIntegerSetting(
      DEFAULT_TENANT_SETTINGS.monthlyWordLimit,
      limits.monthlyWordLimit,
      root.monthlyWordLimit,
      root.monthlyWordLimitWords
    ),
    primaryColor: colorSetting(
      DEFAULT_TENANT_SETTINGS.primaryColor,
      branding.primaryColor,
      root.primaryColor
    ),
    requireUserConsentForRepository: booleanSetting(
      DEFAULT_TENANT_SETTINGS.requireUserConsentForRepository,
      repository.requireUserConsentForRepository,
      repository.requireUserConsent,
      root.requireUserConsentForRepository,
      root.require_user_consent_for_repository
    ),
    retainOriginalFilesDays: positiveIntegerSetting(
      DEFAULT_TENANT_SETTINGS.retainOriginalFilesDays,
      retention.retainOriginalFilesDays,
      retention.retain_original_files_days,
      root.retainOriginalFilesDays,
      root.retain_original_files_days
    ),
    retainReportsDays: positiveIntegerSetting(
      DEFAULT_TENANT_SETTINGS.retainReportsDays,
      retention.retainReportsDays,
      retention.retain_reports_days,
      root.retainReportsDays,
      root.retain_reports_days
    ),
    reportFooter: textSetting(branding.reportFooter, root.reportFooter),
    smallMatchWordThreshold: positiveIntegerSetting(
      DEFAULT_TENANT_SETTINGS.smallMatchWordThreshold,
      preprocessing.smallMatchWordThreshold,
      limits.smallMatchWordThreshold,
      root.smallMatchWordThreshold
    ),
    submissionLimit: positiveIntegerSetting(
      DEFAULT_TENANT_SETTINGS.submissionLimit,
      limits.submissionLimit,
      root.submissionLimit
    )
  };
}

export function buildTenantSettingsJson(
  input: TenantSettingsInput
): Record<string, unknown> {
  const maxFileSizeBytes = Math.floor(input.maxFileSizeMb * bytesPerMegabyte);

  return {
    allowRepositoryReuse: input.allowRepositoryReuse,
    requireUserConsentForRepository: input.requireUserConsentForRepository,
    require_user_consent_for_repository:
      input.requireUserConsentForRepository,
    branding: {
      logoStorageKey: input.logoStorageKey,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      reportFooter: input.reportFooter
    },
    limits: {
      maxFileSizeBytes,
      maxFileSizeMb: input.maxFileSizeMb,
      monthlyWordLimit: input.monthlyWordLimit,
      smallMatchWordThreshold: input.smallMatchWordThreshold,
      submissionLimit: input.submissionLimit
    },
    logoStorageKey: input.logoStorageKey,
    logoUrl: input.logoUrl,
    maxFileSizeBytes,
    maxFileSizeMb: input.maxFileSizeMb,
    monthlyWordLimit: input.monthlyWordLimit,
    monthlyWordLimitWords: input.monthlyWordLimit,
    preprocessing: {
      smallMatchWordThreshold: input.smallMatchWordThreshold
    },
    primaryColor: input.primaryColor,
    repository: {
      allowReuse: input.allowRepositoryReuse,
      requireUserConsent: input.requireUserConsentForRepository,
      requireUserConsentForRepository: input.requireUserConsentForRepository
    },
    retention: {
      retainOriginalFilesDays: input.retainOriginalFilesDays,
      retainReportsDays: input.retainReportsDays
    },
    retain_original_files_days: input.retainOriginalFilesDays,
    retain_reports_days: input.retainReportsDays,
    retainOriginalFilesDays: input.retainOriginalFilesDays,
    retainReportsDays: input.retainReportsDays,
    reportFooter: input.reportFooter,
    smallMatchWordThreshold: input.smallMatchWordThreshold,
    submissionLimit: input.submissionLimit
  };
}

export async function getEditableTenantSettings(
  user: RbacUser,
  options: TenantSettingsServiceOptions = {}
): Promise<EditableTenantSettings | null> {
  const tenantId = getEditableTenantSettingsTenantId(user, options.tenantId);

  if (!tenantId) {
    return null;
  }

  return getTenantSettingsByTenantId(tenantId, options);
}

export async function getDashboardTenantBranding(
  user: RbacUser,
  options: TenantSettingsServiceOptions = {}
): Promise<EditableTenantSettings | null> {
  if (!user.tenantId) {
    return null;
  }

  return getTenantSettingsByTenantId(user.tenantId, options);
}

export async function updateTenantSettings(
  user: RbacUser,
  input: TenantSettingsInput,
  options: TenantSettingsServiceOptions = {}
): Promise<EditableTenantSettings> {
  const tenantId = assertCanEditTenantSettings(user, options.tenantId);
  const db = options.database ?? getDatabase();
  const settingsJson = buildTenantSettingsJson(input);

  return db.transaction(async (tx) => {
    const [settingsRow] = await tx
      .insert(schema.tenantSettings)
      .values({
        settings: settingsJson,
        tenantId
      })
      .onConflictDoUpdate({
        set: {
          settings: settingsJson,
          updatedAt: sql`now()`
        },
        target: schema.tenantSettings.tenantId
      })
      .returning({
        id: schema.tenantSettings.id,
        settings: schema.tenantSettings.settings,
        tenantId: schema.tenantSettings.tenantId
      });

    await tx.insert(schema.auditEvents).values({
      action: "tenant.settings.update",
      actorUserId: user.id,
      entityId: settingsRow.id,
      entityType: "tenant_settings",
      metadata: {
        allowRepositoryReuse: input.allowRepositoryReuse,
        maxFileSizeBytes: settingsJson.maxFileSizeBytes,
        monthlyWordLimit: input.monthlyWordLimit,
        requireUserConsentForRepository:
          input.requireUserConsentForRepository,
        retainOriginalFilesDays: input.retainOriginalFilesDays,
        retainReportsDays: input.retainReportsDays,
        smallMatchWordThreshold: input.smallMatchWordThreshold,
        submissionLimit: input.submissionLimit
      },
      tenantId
    });

    const tenant = await getTenantById(tx, tenantId);

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return {
      settings: normalizeTenantSettings(settingsRow.settings),
      tenant
    };
  });
}

export function assertCanEditTenantSettings(
  user: RbacUser,
  requestedTenantId?: string
): string {
  if (user.role === "INSTITUTION_ADMIN" && user.tenantId) {
    return user.tenantId;
  }

  if (user.role === "SUPER_ADMIN" && requestedTenantId) {
    return requestedTenantId;
  }

  throw new AuthorizationError("Tenant settings access denied");
}

function getEditableTenantSettingsTenantId(
  user: RbacUser,
  requestedTenantId?: string
): string | null {
  if (user.role === "INSTITUTION_ADMIN" && user.tenantId) {
    return user.tenantId;
  }

  return user.role === "SUPER_ADMIN" ? requestedTenantId ?? null : null;
}

async function getTenantSettingsByTenantId(
  tenantId: string,
  options: TenantSettingsServiceOptions
): Promise<EditableTenantSettings | null> {
  const db = options.database ?? getDatabase();
  const tenant = await getTenantById(db, tenantId);

  if (!tenant) {
    return null;
  }

  const [settingsRow] = await db
    .select({
      settings: schema.tenantSettings.settings
    })
    .from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenantId))
    .limit(1);

  return {
    settings: normalizeTenantSettings(settingsRow?.settings),
    tenant
  };
}

async function getTenantById(
  db: Database,
  tenantId: string
): Promise<EditableTenantSettings["tenant"] | null> {
  const [tenant] = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  return tenant ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function booleanSetting(defaultValue: boolean, ...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return defaultValue;
}

function colorSetting(defaultValue: string, ...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
      return value.trim().toLowerCase();
    }
  }

  return defaultValue;
}

function emptyStringToNull(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function positiveIntegerSetting(defaultValue: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return defaultValue;
}

function positiveNumberSetting(defaultValue: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return defaultValue;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function textSetting(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}
