import { and, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { getDatabase, schema, type Database } from "../../lib/db";
import { env } from "../../lib/env";
import type { ScanMode } from "../../lib/jobs/scan-queue";
import { checkFeatureRateLimit } from "./feature-rate-limit.service";

export const FEATURE_KEYS = [
  "FULL_CHECK",
  "WEB_SOURCE_MATCHING",
  "AI_WRITING_ANALYSIS",
  "ACADEMIC_SOURCE_LOOKUP",
  "GRAMMAR_REVIEW",
  "PDF_REPORT",
  "FALLBACK_SCAN",
  "MONTHLY_WORDS"
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type FeatureUsagePeriod = "day" | "minute" | "month";
export type FeatureUsageStatus =
  | "blocked"
  | "consumed"
  | "estimated"
  | "fallback"
  | "refunded"
  | "reserved";
export type FeatureUnitType =
  | "character"
  | "credit"
  | "report"
  | "request"
  | "scan"
  | "token"
  | "word";

export type FeatureBudgetConfig = {
  academicSourceDailyUnits: number;
  academicSourceDeepUnitsPerScan: number;
  academicSourceMonthlyUnits: number;
  academicSourcePerMinuteUnits: number;
  academicSourceStandardUnitsPerScan: number;
  aiWritingAnalysisDailyRequests: number;
  aiWritingAnalysisMaxInputTokens: number;
  aiWritingAnalysisMaxOutputTokens: number;
  aiWritingAnalysisMaxTotalTokensPerScan: number;
  aiWritingAnalysisMonthlyRequests: number;
  aiWritingAnalysisRpm: number;
  aiWritingAnalysisStandardRequestsPerScan: number;
  allowLocalFallbackWhenBudgetExhausted: boolean;
  blockScanWhenAllFeatureBudgetsExhausted: boolean;
  budgetsEnabled: boolean;
  defaultScanMode: ScanMode;
  enableBudgetPreviewBeforeScan: boolean;
  enableDeepScan: boolean;
  featureUsageDashboardEnabled: boolean;
  grammarReviewDailyCharacters: number;
  grammarReviewDeepCharsPerScan: number;
  grammarReviewMaxRequestsPerMinute: number;
  grammarReviewMonthlyCharacters: number;
  grammarReviewPerMinuteCharacters: number;
  grammarReviewStandardCharsPerScan: number;
  monthlyDeepCheckLimit: number;
  monthlyFileLimit: number;
  monthlyFullCheckLimit: number;
  monthlyWordLimit: number;
  pdfReportDailyLimit: number;
  pdfReportMonthlyLimit: number;
  rateLimitsEnabled: boolean;
  showFallbackBadge: boolean;
  webSourceMatchingDailyUnits: number;
  webSourceMatchingDeepUnitsPerScan: number;
  webSourceMatchingMonthlyUnits: number;
  webSourceMatchingPerMinuteUnits: number;
  webSourceMatchingReserveUnits: number;
  webSourceMatchingStandardUnitsPerScan: number;
};

export type FeatureUsageEstimate = {
  featureKey: FeatureKey;
  featureLabel: string;
  unitType: FeatureUnitType;
  units: number;
};

export type ScanUsageEstimate = {
  items: FeatureUsageEstimate[];
  scanMode: ScanMode;
};

export type FeatureBudgetCard = {
  critical: boolean;
  featureKey: FeatureKey;
  featureLabel: string;
  limit: number;
  percentUsed: number;
  remaining: number;
  resetAt: string;
  unitLabel: string;
  used: number;
  warning: boolean;
};

export type FeatureReservationResult =
  | {
      allowed: true;
      featureKey: FeatureKey;
      reservationId: string | null;
      units: number;
    }
  | {
      allowed: false;
      featureKey: FeatureKey;
      message: string;
      resetAt: Date;
      units: number;
    };

export type FeatureUsageActor = {
  submissionId?: string | null;
  tenantId: string;
  userId?: string | null;
};

type FeatureDefinition = {
  featureKey: FeatureKey;
  featureLabel: string;
  monthlyLimit: number;
  unitLabel: string;
  unitType: FeatureUnitType;
};

type FeatureBudgetServiceOptions = {
  config?: FeatureBudgetConfig;
  database?: Database;
  now?: Date;
};

type FeatureUsageInput = FeatureUsageActor & {
  featureKey: FeatureKey;
  metadata?: Record<string, unknown>;
  period?: FeatureUsagePeriod;
  units: number;
};

type ScanBudgetInput = FeatureUsageActor & {
  charCount: number;
  meaningfulChunkCount?: number;
  scanMode: ScanMode;
  wordCount: number;
};

const featureLabels = {
  ACADEMIC_SOURCE_LOOKUP: "Academic Source Lookup",
  AI_WRITING_ANALYSIS: "AI Writing Analysis",
  FALLBACK_SCAN: "Fallback Scans",
  FULL_CHECK: "Full Checks",
  GRAMMAR_REVIEW: "Grammar Review",
  MONTHLY_WORDS: "Monthly Words Processed",
  PDF_REPORT: "PDF Reports",
  WEB_SOURCE_MATCHING: "Web Source Matching"
} as const satisfies Record<FeatureKey, string>;

const featureUnitTypes = {
  ACADEMIC_SOURCE_LOOKUP: "credit",
  AI_WRITING_ANALYSIS: "request",
  FALLBACK_SCAN: "scan",
  FULL_CHECK: "scan",
  GRAMMAR_REVIEW: "character",
  MONTHLY_WORDS: "word",
  PDF_REPORT: "report",
  WEB_SOURCE_MATCHING: "credit"
} as const satisfies Record<FeatureKey, FeatureUnitType>;

const unitLabels = {
  character: "characters",
  credit: "units",
  report: "reports",
  request: "requests",
  scan: "checks",
  token: "tokens",
  word: "words"
} as const satisfies Record<FeatureUnitType, string>;

export class FeatureBudgetExhaustedError extends Error {
  readonly code = "FEATURE_BUDGET_EXHAUSTED";

  constructor(message = "Feature budgets are exhausted") {
    super(message);
    this.name = "FeatureBudgetExhaustedError";
  }
}

export function readFeatureBudgetConfig(): FeatureBudgetConfig {
  return {
    academicSourceDailyUnits: env.ACADEMIC_SOURCE_DAILY_UNITS,
    academicSourceDeepUnitsPerScan: env.ACADEMIC_SOURCE_DEEP_UNITS_PER_SCAN,
    academicSourceMonthlyUnits: env.ACADEMIC_SOURCE_MONTHLY_UNITS,
    academicSourcePerMinuteUnits: env.ACADEMIC_SOURCE_PER_MINUTE_UNITS,
    academicSourceStandardUnitsPerScan:
      env.ACADEMIC_SOURCE_STANDARD_UNITS_PER_SCAN,
    aiWritingAnalysisDailyRequests: env.AI_WRITING_ANALYSIS_DAILY_REQUESTS,
    aiWritingAnalysisMaxInputTokens: env.AI_WRITING_ANALYSIS_MAX_INPUT_TOKENS,
    aiWritingAnalysisMaxOutputTokens: env.AI_WRITING_ANALYSIS_MAX_OUTPUT_TOKENS,
    aiWritingAnalysisMaxTotalTokensPerScan:
      env.AI_WRITING_ANALYSIS_MAX_TOTAL_TOKENS_PER_SCAN,
    aiWritingAnalysisMonthlyRequests:
      env.AI_WRITING_ANALYSIS_MONTHLY_REQUESTS,
    aiWritingAnalysisRpm: env.AI_WRITING_ANALYSIS_RPM,
    aiWritingAnalysisStandardRequestsPerScan:
      env.AI_WRITING_ANALYSIS_STANDARD_REQUESTS_PER_SCAN,
    allowLocalFallbackWhenBudgetExhausted:
      env.ALLOW_LOCAL_FALLBACK_WHEN_BUDGET_EXHAUSTED,
    blockScanWhenAllFeatureBudgetsExhausted:
      env.BLOCK_SCAN_WHEN_ALL_FEATURE_BUDGETS_EXHAUSTED,
    budgetsEnabled: env.FEATURE_BUDGETS_ENABLED,
    defaultScanMode: env.DEFAULT_SCAN_MODE,
    enableBudgetPreviewBeforeScan: env.ENABLE_BUDGET_PREVIEW_BEFORE_SCAN,
    enableDeepScan: env.ENABLE_DEEP_SCAN,
    featureUsageDashboardEnabled: env.FEATURE_USAGE_DASHBOARD_ENABLED,
    grammarReviewDailyCharacters: env.GRAMMAR_REVIEW_DAILY_CHARACTERS,
    grammarReviewDeepCharsPerScan: env.GRAMMAR_REVIEW_DEEP_CHARS_PER_SCAN,
    grammarReviewMaxRequestsPerMinute:
      env.GRAMMAR_REVIEW_MAX_REQUESTS_PER_MINUTE,
    grammarReviewMonthlyCharacters: env.GRAMMAR_REVIEW_MONTHLY_CHARACTERS,
    grammarReviewPerMinuteCharacters: env.GRAMMAR_REVIEW_PER_MINUTE_CHARACTERS,
    grammarReviewStandardCharsPerScan:
      env.GRAMMAR_REVIEW_STANDARD_CHARS_PER_SCAN,
    monthlyDeepCheckLimit: env.MONTHLY_DEEP_CHECK_LIMIT,
    monthlyFileLimit: env.MONTHLY_FILE_LIMIT,
    monthlyFullCheckLimit: env.MONTHLY_FULL_CHECK_LIMIT,
    monthlyWordLimit: env.MONTHLY_WORD_LIMIT,
    pdfReportDailyLimit: env.PDF_REPORT_DAILY_LIMIT,
    pdfReportMonthlyLimit: env.PDF_REPORT_MONTHLY_LIMIT,
    rateLimitsEnabled: env.FEATURE_RATE_LIMITS_ENABLED,
    showFallbackBadge: env.SHOW_FALLBACK_BADGE,
    webSourceMatchingDailyUnits: env.WEB_SOURCE_MATCHING_DAILY_UNITS,
    webSourceMatchingDeepUnitsPerScan:
      env.WEB_SOURCE_MATCHING_DEEP_UNITS_PER_SCAN,
    webSourceMatchingMonthlyUnits: env.WEB_SOURCE_MATCHING_MONTHLY_UNITS,
    webSourceMatchingPerMinuteUnits:
      env.WEB_SOURCE_MATCHING_PER_MINUTE_UNITS,
    webSourceMatchingReserveUnits: env.WEB_SOURCE_MATCHING_RESERVE_UNITS,
    webSourceMatchingStandardUnitsPerScan:
      env.WEB_SOURCE_MATCHING_STANDARD_UNITS_PER_SCAN
  };
}

export function estimateScanUsage(
  input: {
    charCount: number;
    meaningfulChunkCount?: number;
    scanMode: ScanMode;
    wordCount: number;
  },
  config: FeatureBudgetConfig = readFeatureBudgetConfig()
): ScanUsageEstimate {
  const scanMode = normalizeScanMode(input.scanMode, config);
  const wordCount = sanitizeUnits(input.wordCount);
  const charCount = sanitizeUnits(input.charCount);

  if (scanMode === "fallback") {
    return {
      items: [
        buildEstimateItem("FALLBACK_SCAN", 1),
        buildEstimateItem("MONTHLY_WORDS", wordCount)
      ],
      scanMode
    };
  }

  const isDeep = scanMode === "deep";
  const grammarCap = getGrammarCharacterLimitForScanMode(scanMode, config);

  return {
    items: [
      buildEstimateItem("FULL_CHECK", isDeep ? 2 : 1),
      buildEstimateItem("MONTHLY_WORDS", wordCount),
      buildEstimateItem(
        "WEB_SOURCE_MATCHING",
        isDeep
          ? config.webSourceMatchingDeepUnitsPerScan
          : config.webSourceMatchingStandardUnitsPerScan
      ),
      buildEstimateItem(
        "AI_WRITING_ANALYSIS",
        config.aiWritingAnalysisStandardRequestsPerScan
      ),
      buildEstimateItem(
        "ACADEMIC_SOURCE_LOOKUP",
        isDeep
          ? config.academicSourceDeepUnitsPerScan
          : config.academicSourceStandardUnitsPerScan
      ),
      buildEstimateItem("GRAMMAR_REVIEW", Math.min(charCount, grammarCap))
    ],
    scanMode
  };
}

export function getFeatureLabel(featureKey: FeatureKey): string {
  return featureLabels[featureKey];
}

export function getFeatureUnitType(featureKey: FeatureKey): FeatureUnitType {
  return featureUnitTypes[featureKey];
}

export function getGrammarCharacterLimitForScanMode(
  scanMode: ScanMode,
  config: FeatureBudgetConfig = readFeatureBudgetConfig()
): number {
  return scanMode === "deep"
    ? config.grammarReviewDeepCharsPerScan
    : config.grammarReviewStandardCharsPerScan;
}

export function estimateAiInputTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function capTextToAiInputBudget(
  text: string,
  config: FeatureBudgetConfig = readFeatureBudgetConfig()
): string {
  const maxInputTokens = Math.min(
    config.aiWritingAnalysisMaxInputTokens,
    Math.max(
      1,
      config.aiWritingAnalysisMaxTotalTokensPerScan -
        config.aiWritingAnalysisMaxOutputTokens
    )
  );
  const maxCharacters = maxInputTokens * 4;

  return text.length > maxCharacters ? text.slice(0, maxCharacters) : text;
}

export function normalizeScanMode(
  scanMode: ScanMode | string | undefined,
  config: FeatureBudgetConfig = readFeatureBudgetConfig()
): ScanMode {
  if (scanMode === "fallback") {
    return "fallback";
  }

  if (scanMode === "deep" && config.enableDeepScan) {
    return "deep";
  }

  if (scanMode === "standard") {
    return "standard";
  }

  return config.defaultScanMode === "deep" && config.enableDeepScan
    ? "deep"
    : config.defaultScanMode;
}

export async function getTenantFeatureBudgets(
  tenantId: string | null,
  options: FeatureBudgetServiceOptions = {}
): Promise<FeatureBudgetCard[]> {
  const config = options.config ?? readFeatureBudgetConfig();

  if (!config.featureUsageDashboardEnabled) {
    return [];
  }

  const db = options.database ?? getDatabase();
  const now = options.now ?? new Date();
  const definitions = await getFeatureDefinitions(db, tenantId, config);

  return Promise.all(
    definitions.map(async (definition) => {
      const usage = await getUsageForFeaturePeriod(db, {
        featureKey: definition.featureKey,
        now,
        period: "month",
        tenantId
      });
      const used = usage.consumedUnits + usage.reservedUnits;
      const state = calculateBudgetState(used, definition.monthlyLimit);

      return {
        critical: state.critical,
        featureKey: definition.featureKey,
        featureLabel: definition.featureLabel,
        limit: definition.monthlyLimit,
        percentUsed: state.percentUsed,
        remaining: state.remaining,
        resetAt: usage.resetAt.toISOString(),
        unitLabel: definition.unitLabel,
        used,
        warning: state.warning
      };
    })
  );
}

export async function getRemainingFeatureBudget(
  tenantId: string,
  featureKey: FeatureKey,
  options: FeatureBudgetServiceOptions & {
    period?: FeatureUsagePeriod;
  } = {}
): Promise<{
  limit: number;
  remaining: number;
  resetAt: Date;
  used: number;
}> {
  const config = options.config ?? readFeatureBudgetConfig();
  const db = options.database ?? getDatabase();
  const period = options.period ?? "month";
  const limit = await resolveFeatureLimit(db, tenantId, featureKey, period, config);
  const usage = await getUsageForFeaturePeriod(db, {
    featureKey,
    now: options.now ?? new Date(),
    period,
    tenantId
  });
  const used = usage.consumedUnits + usage.reservedUnits;

  return {
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: usage.resetAt,
    used
  };
}

export async function assertCanRunScan(
  input: ScanBudgetInput,
  options: FeatureBudgetServiceOptions = {}
): Promise<ScanUsageEstimate> {
  const config = options.config ?? readFeatureBudgetConfig();
  const db = options.database ?? getDatabase();
  const estimate = estimateScanUsage(input, config);

  if (!config.budgetsEnabled) {
    return estimate;
  }

  for (const featureKey of ["FULL_CHECK", "MONTHLY_WORDS"] as const) {
    const item = estimate.items.find((entry) => entry.featureKey === featureKey);

    if (!item) {
      continue;
    }

    await assertFeatureHasCapacity(db, input, item, config, options.now);
  }

  if (estimate.scanMode === "deep") {
    await assertDeepScanCapacity(db, input, config, options.now);
  }

  if (estimate.scanMode === "fallback") {
    return estimate;
  }

  const externalItems = estimate.items.filter((item) =>
    [
      "WEB_SOURCE_MATCHING",
      "AI_WRITING_ANALYSIS",
      "ACADEMIC_SOURCE_LOOKUP",
      "GRAMMAR_REVIEW"
    ].includes(item.featureKey)
  );
  const remainingEntries = await Promise.all(
    externalItems.map(async (item) => {
      const capacity = await getRemainingFeatureBudget(input.tenantId, item.featureKey, {
        config,
        database: db,
        now: options.now,
        period: "month"
      });

      return [item.featureKey, capacity.remaining] as const;
    })
  );
  const remainingByFeature = Object.fromEntries(remainingEntries) as Partial<
    Record<FeatureKey, number>
  >;

  if (shouldBlockScanWhenAllExternalFeatureBudgetsExhausted(estimate, remainingByFeature, config)) {
    await recordBlockedUsage(db, {
      ...input,
      featureKey: "FULL_CHECK",
      metadata: {
        reason: "all_feature_budgets_exhausted",
        scanMode: estimate.scanMode
      },
      units: estimate.scanMode === "deep" ? 2 : 1
    });
    throw new FeatureBudgetExhaustedError(
      "All scan feature budgets are exhausted. Use Local Fallback Check or try again after the budget resets."
    );
  }

  return estimate;
}

export async function reserveFeatureUsage(
  input: FeatureUsageInput,
  options: FeatureBudgetServiceOptions = {}
): Promise<FeatureReservationResult> {
  const config = options.config ?? readFeatureBudgetConfig();
  const units = sanitizeUnits(input.units);

  if (!config.budgetsEnabled || units === 0) {
    return {
      allowed: true,
      featureKey: input.featureKey,
      reservationId: null,
      units
    };
  }

  const db = options.database ?? getDatabase();
  const now = options.now ?? new Date();
  const capacity = await getRemainingFeatureBudget(input.tenantId, input.featureKey, {
    config,
    database: db,
    now,
    period: input.period ?? "month"
  });

  if (capacity.remaining < units) {
    await recordBlockedUsage(db, {
      ...input,
      metadata: {
        ...(input.metadata ?? {}),
        limit: capacity.limit,
        remaining: capacity.remaining
      },
      units
    });

    return {
      allowed: false,
      featureKey: input.featureKey,
      message: `${getFeatureLabel(input.featureKey)} budget is exhausted.`,
      resetAt: capacity.resetAt,
      units
    };
  }

  const dailyCapacity = await getRemainingFeatureBudget(
    input.tenantId,
    input.featureKey,
    {
      config,
      database: db,
      now,
      period: "day"
    }
  );

  if (dailyCapacity.remaining < units) {
    await recordBlockedUsage(db, {
      ...input,
      metadata: {
        ...(input.metadata ?? {}),
        limit: dailyCapacity.limit,
        remaining: dailyCapacity.remaining
      },
      period: "day",
      units
    });

    return {
      allowed: false,
      featureKey: input.featureKey,
      message: `${getFeatureLabel(input.featureKey)} daily capacity is exhausted.`,
      resetAt: dailyCapacity.resetAt,
      units
    };
  }

  const rateLimit = await checkFeatureRateLimit(
    {
      database: db,
      featureKey: input.featureKey,
      tenantId: input.tenantId,
      units
    },
    {
      config,
      now
    }
  );

  if (!rateLimit.allowed) {
    await recordBlockedUsage(db, {
      ...input,
      metadata: {
        ...(input.metadata ?? {}),
        reason: rateLimit.message
      },
      units
    });

    return {
      allowed: false,
      featureKey: input.featureKey,
      message: rateLimit.message,
      resetAt: rateLimit.resetAt,
      units
    };
  }

  const [event] = await db
    .insert(schema.featureUsageEvents)
    .values({
      featureKey: input.featureKey,
      featureLabel: getFeatureLabel(input.featureKey),
      metadata: input.metadata ?? {},
      period: input.period ?? "month",
      resetAt: getPeriodWindow(now, input.period ?? "month").resetAt,
      status: "reserved",
      submissionId: input.submissionId ?? null,
      tenantId: input.tenantId,
      unitType: getFeatureUnitType(input.featureKey),
      unitsReserved: units,
      userId: input.userId ?? null
    })
    .returning({
      id: schema.featureUsageEvents.id
    });

  await writeBudgetAuditEvent(db, {
    action: "FEATURE_BUDGET_RESERVED",
    eventId: event.id,
    featureKey: input.featureKey,
    metadata: input.metadata,
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    units,
    userId: input.userId
  });

  return {
    allowed: true,
    featureKey: input.featureKey,
    reservationId: event.id,
    units
  };
}

export async function consumeFeatureUsage(
  input: {
    metadata?: Record<string, unknown>;
    reservationId: string | null;
    unitsConsumed?: number;
  },
  options: FeatureBudgetServiceOptions = {}
): Promise<void> {
  if (!input.reservationId) {
    return;
  }

  const db = options.database ?? getDatabase();
  const [event] = await db
    .select({
      featureKey: schema.featureUsageEvents.featureKey,
      metadata: schema.featureUsageEvents.metadata,
      submissionId: schema.featureUsageEvents.submissionId,
      tenantId: schema.featureUsageEvents.tenantId,
      unitsReserved: schema.featureUsageEvents.unitsReserved,
      userId: schema.featureUsageEvents.userId
    })
    .from(schema.featureUsageEvents)
    .where(eq(schema.featureUsageEvents.id, input.reservationId))
    .limit(1);

  if (!event || !isFeatureKey(event.featureKey)) {
    return;
  }

  const units = sanitizeUnits(input.unitsConsumed ?? event.unitsReserved);

  await db
    .update(schema.featureUsageEvents)
    .set({
      metadata: {
        ...(isRecord(event.metadata) ? event.metadata : {}),
        ...(input.metadata ?? {})
      },
      status: "consumed",
      unitsConsumed: units,
      unitsReserved: 0
    })
    .where(eq(schema.featureUsageEvents.id, input.reservationId));

  await writeBudgetAuditEvent(db, {
    action: "FEATURE_BUDGET_CONSUMED",
    eventId: input.reservationId,
    featureKey: event.featureKey,
    metadata: input.metadata,
    submissionId: event.submissionId,
    tenantId: event.tenantId,
    units,
    userId: event.userId
  });
}

export async function consumeReservedFeatureUsageForSubmission(
  input: FeatureUsageActor & {
    featureKeys: FeatureKey[];
    metadata?: Record<string, unknown>;
  },
  options: FeatureBudgetServiceOptions = {}
): Promise<void> {
  if (!input.submissionId) {
    return;
  }

  const db = options.database ?? getDatabase();
  const rows = await db
    .select({
      id: schema.featureUsageEvents.id
    })
    .from(schema.featureUsageEvents)
    .where(
      and(
        eq(schema.featureUsageEvents.tenantId, input.tenantId),
        eq(schema.featureUsageEvents.submissionId, input.submissionId),
        eq(schema.featureUsageEvents.status, "reserved"),
        inArray(schema.featureUsageEvents.featureKey, input.featureKeys)
      )
    );

  for (const row of rows) {
    await consumeFeatureUsage(
      {
        metadata: input.metadata,
        reservationId: row.id
      },
      {
        database: db
      }
    );
  }
}

export async function refundFeatureUsage(
  input: {
    metadata?: Record<string, unknown>;
    reservationId: string | null;
  },
  options: FeatureBudgetServiceOptions = {}
): Promise<void> {
  if (!input.reservationId) {
    return;
  }

  const db = options.database ?? getDatabase();
  await db
    .update(schema.featureUsageEvents)
    .set({
      metadata: input.metadata ?? {},
      status: "refunded",
      unitsConsumed: 0,
      unitsReserved: 0
    })
    .where(eq(schema.featureUsageEvents.id, input.reservationId));
}

export async function recordFallbackUsage(
  input: FeatureUsageInput,
  options: FeatureBudgetServiceOptions = {}
): Promise<void> {
  const db = options.database ?? getDatabase();
  const now = options.now ?? new Date();
  const period = input.period ?? "month";
  const units = sanitizeUnits(input.units);

  const [event] = await db
    .insert(schema.featureUsageEvents)
    .values({
      featureKey: input.featureKey,
      featureLabel: getFeatureLabel(input.featureKey),
      metadata: input.metadata ?? {},
      period,
      resetAt: getPeriodWindow(now, period).resetAt,
      status: "fallback",
      submissionId: input.submissionId ?? null,
      tenantId: input.tenantId,
      unitType: getFeatureUnitType(input.featureKey),
      unitsConsumed: units,
      userId: input.userId ?? null
    })
    .returning({
      id: schema.featureUsageEvents.id
    });

  await writeBudgetAuditEvent(db, {
    action: "FEATURE_FALLBACK_USED",
    eventId: event.id,
    featureKey: input.featureKey,
    metadata: input.metadata,
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    units,
    userId: input.userId
  });
}

export async function upsertTenantFeatureBudgetLimits(
  tenantId: string,
  limits: Array<{
    featureKey: FeatureKey;
    limitUnits: number;
    period?: FeatureUsagePeriod;
  }>,
  options: FeatureBudgetServiceOptions = {}
): Promise<void> {
  const db = options.database ?? getDatabase();

  for (const limit of limits) {
    const period = limit.period ?? "month";
    await db
      .insert(schema.featureQuotaLimits)
      .values({
        featureKey: limit.featureKey,
        featureLabel: getFeatureLabel(limit.featureKey),
        limitUnits: sanitizeUnits(limit.limitUnits),
        period,
        tenantId,
        unitType: getFeatureUnitType(limit.featureKey)
      })
      .onConflictDoUpdate({
        set: {
          featureLabel: getFeatureLabel(limit.featureKey),
          limitUnits: sanitizeUnits(limit.limitUnits),
          unitType: getFeatureUnitType(limit.featureKey),
          updatedAt: sql`now()`
        },
        target: [
          schema.featureQuotaLimits.tenantId,
          schema.featureQuotaLimits.featureKey,
          schema.featureQuotaLimits.period
        ]
      });
  }
}

export function parseFeatureBudgetLimitFormData(
  formData: FormData
): Array<{
  featureKey: FeatureKey;
  limitUnits: number;
  period: FeatureUsagePeriod;
}> {
  const limits: Array<{
    featureKey: FeatureKey;
    limitUnits: number;
    period: FeatureUsagePeriod;
  }> = [];

  for (const featureKey of FEATURE_KEYS) {
    const rawValue = formData.get(`budget_${featureKey}`);
    const parsedValue =
      typeof rawValue === "string" ? Number(rawValue.trim()) : Number.NaN;

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      continue;
    }

    limits.push({
      featureKey,
      limitUnits: parsedValue,
      period: "month"
    });
  }

  return limits;
}

export function calculatePercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }

  return Number(Math.min(100, (used / limit) * 100).toFixed(2));
}

export function calculateBudgetState(
  used: number,
  limit: number
): {
  critical: boolean;
  percentUsed: number;
  remaining: number;
  warning: boolean;
} {
  const remaining = Math.max(0, limit - used);
  const percentUsed = calculatePercent(used, limit);
  const remainingPercent = 100 - percentUsed;

  return {
    critical: remainingPercent <= 5,
    percentUsed,
    remaining,
    warning: remainingPercent <= 20
  };
}

export function shouldBlockScanWhenAllExternalFeatureBudgetsExhausted(
  estimate: ScanUsageEstimate,
  remainingByFeature: Partial<Record<FeatureKey, number>>,
  config: FeatureBudgetConfig = readFeatureBudgetConfig()
): boolean {
  if (
    !config.blockScanWhenAllFeatureBudgetsExhausted ||
    estimate.scanMode === "fallback"
  ) {
    return false;
  }

  const externalItems = estimate.items.filter((item) =>
    [
      "WEB_SOURCE_MATCHING",
      "AI_WRITING_ANALYSIS",
      "ACADEMIC_SOURCE_LOOKUP",
      "GRAMMAR_REVIEW"
    ].includes(item.featureKey)
  );

  return (
    externalItems.length > 0 &&
    externalItems.every(
      (item) => (remainingByFeature[item.featureKey] ?? Number.POSITIVE_INFINITY) < item.units
    )
  );
}

async function assertFeatureHasCapacity(
  db: Database,
  actor: FeatureUsageActor,
  item: FeatureUsageEstimate,
  config: FeatureBudgetConfig,
  now?: Date
): Promise<void> {
  const capacity = await getRemainingFeatureBudget(actor.tenantId, item.featureKey, {
    config,
    database: db,
    now,
    period: "month"
  });

  if (capacity.remaining >= item.units) {
    return;
  }

  await recordBlockedUsage(db, {
    ...actor,
    featureKey: item.featureKey,
    metadata: {
      limit: capacity.limit,
      remaining: capacity.remaining
    },
    units: item.units
  });

  throw new FeatureBudgetExhaustedError(
    `${item.featureLabel} budget is exhausted. Try again after ${capacity.resetAt.toLocaleString()}.`
  );
}

async function assertDeepScanCapacity(
  db: Database,
  input: ScanBudgetInput,
  config: FeatureBudgetConfig,
  now = new Date()
): Promise<void> {
  const window = getPeriodWindow(now, "month");
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.featureUsageEvents.unitsConsumed} + ${schema.featureUsageEvents.unitsReserved}), 0)::int`
    })
    .from(schema.featureUsageEvents)
    .where(
      and(
        eq(schema.featureUsageEvents.tenantId, input.tenantId),
        eq(schema.featureUsageEvents.featureKey, "FULL_CHECK"),
        gte(schema.featureUsageEvents.createdAt, window.periodStart),
        sql`${schema.featureUsageEvents.metadata}->>'scanMode' = 'deep'`,
        sql`${schema.featureUsageEvents.status} IN ('reserved', 'consumed')`
      )
    );

  if (Number(result.total) < config.monthlyDeepCheckLimit) {
    return;
  }

  await recordBlockedUsage(db, {
    ...input,
    featureKey: "FULL_CHECK",
    metadata: {
      limit: config.monthlyDeepCheckLimit,
      reason: "monthly_deep_check_limit",
      scanMode: "deep"
    },
    units: 2
  });

  throw new FeatureBudgetExhaustedError(
    "Deep Check monthly capacity is exhausted. Use Standard Check or Local Fallback Check."
  );
}

async function recordBlockedUsage(
  db: Database,
  input: FeatureUsageInput
): Promise<void> {
  const now = new Date();
  const period = input.period ?? "month";
  const [event] = await db
    .insert(schema.featureUsageEvents)
    .values({
      featureKey: input.featureKey,
      featureLabel: getFeatureLabel(input.featureKey),
      metadata: input.metadata ?? {},
      period,
      resetAt: getPeriodWindow(now, period).resetAt,
      status: "blocked",
      submissionId: input.submissionId ?? null,
      tenantId: input.tenantId,
      unitType: getFeatureUnitType(input.featureKey),
      unitsConsumed: sanitizeUnits(input.units),
      userId: input.userId ?? null
    })
    .returning({
      id: schema.featureUsageEvents.id
    });

  await writeBudgetAuditEvent(db, {
    action:
      input.featureKey === "FULL_CHECK"
        ? "SCAN_BLOCKED_BY_BUDGET"
        : "FEATURE_BUDGET_EXHAUSTED",
    eventId: event.id,
    featureKey: input.featureKey,
    metadata: input.metadata,
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    units: input.units,
    userId: input.userId
  });
}

async function getFeatureDefinitions(
  db: Database,
  tenantId: string | null,
  config: FeatureBudgetConfig
): Promise<FeatureDefinition[]> {
  const tenantMultiplier = tenantId ? 1 : await countTenants(db);
  const baseDefinitions = getBaseFeatureDefinitions(config).map((definition) => ({
    ...definition,
    monthlyLimit: definition.monthlyLimit * Math.max(1, tenantMultiplier)
  }));

  if (!tenantId) {
    return baseDefinitions;
  }

  const rows = await db
    .select({
      featureKey: schema.featureQuotaLimits.featureKey,
      limitUnits: schema.featureQuotaLimits.limitUnits
    })
    .from(schema.featureQuotaLimits)
    .where(
      and(
        eq(schema.featureQuotaLimits.tenantId, tenantId),
        eq(schema.featureQuotaLimits.period, "month")
      )
    );
  const overrideMap = new Map(
    rows
      .filter((row) => isFeatureKey(row.featureKey))
      .map((row) => [row.featureKey as FeatureKey, row.limitUnits])
  );

  return baseDefinitions.map((definition) => ({
    ...definition,
    monthlyLimit:
      overrideMap.get(definition.featureKey) ?? definition.monthlyLimit
  }));
}

function getBaseFeatureDefinitions(
  config: FeatureBudgetConfig
): FeatureDefinition[] {
  return [
    buildDefinition("FULL_CHECK", config.monthlyFullCheckLimit),
    buildDefinition(
      "WEB_SOURCE_MATCHING",
      config.webSourceMatchingMonthlyUnits
    ),
    buildDefinition(
      "AI_WRITING_ANALYSIS",
      config.aiWritingAnalysisMonthlyRequests
    ),
    buildDefinition(
      "ACADEMIC_SOURCE_LOOKUP",
      config.academicSourceMonthlyUnits
    ),
    buildDefinition("GRAMMAR_REVIEW", config.grammarReviewMonthlyCharacters),
    buildDefinition("PDF_REPORT", config.pdfReportMonthlyLimit),
    buildDefinition("FALLBACK_SCAN", config.monthlyFullCheckLimit),
    buildDefinition("MONTHLY_WORDS", config.monthlyWordLimit)
  ];
}

function buildDefinition(
  featureKey: FeatureKey,
  monthlyLimit: number
): FeatureDefinition {
  const unitType = getFeatureUnitType(featureKey);

  return {
    featureKey,
    featureLabel: getFeatureLabel(featureKey),
    monthlyLimit,
    unitLabel: unitLabels[unitType],
    unitType
  };
}

async function resolveFeatureLimit(
  db: Database,
  tenantId: string,
  featureKey: FeatureKey,
  period: FeatureUsagePeriod,
  config: FeatureBudgetConfig
): Promise<number> {
  const [override] = await db
    .select({
      limitUnits: schema.featureQuotaLimits.limitUnits
    })
    .from(schema.featureQuotaLimits)
    .where(
      and(
        eq(schema.featureQuotaLimits.tenantId, tenantId),
        eq(schema.featureQuotaLimits.featureKey, featureKey),
        eq(schema.featureQuotaLimits.period, period)
      )
    )
    .limit(1);

  return override?.limitUnits ?? getConfiguredFeatureLimit(featureKey, period, config);
}

function getConfiguredFeatureLimit(
  featureKey: FeatureKey,
  period: FeatureUsagePeriod,
  config: FeatureBudgetConfig
): number {
  if (featureKey === "WEB_SOURCE_MATCHING") {
    return period === "month"
      ? config.webSourceMatchingMonthlyUnits
      : period === "day"
        ? config.webSourceMatchingDailyUnits
        : config.webSourceMatchingPerMinuteUnits;
  }

  if (featureKey === "AI_WRITING_ANALYSIS") {
    return period === "month"
      ? config.aiWritingAnalysisMonthlyRequests
      : period === "day"
        ? config.aiWritingAnalysisDailyRequests
        : config.aiWritingAnalysisRpm;
  }

  if (featureKey === "ACADEMIC_SOURCE_LOOKUP") {
    return period === "month"
      ? config.academicSourceMonthlyUnits
      : period === "day"
        ? config.academicSourceDailyUnits
        : config.academicSourcePerMinuteUnits;
  }

  if (featureKey === "GRAMMAR_REVIEW") {
    return period === "month"
      ? config.grammarReviewMonthlyCharacters
      : period === "day"
        ? config.grammarReviewDailyCharacters
        : config.grammarReviewPerMinuteCharacters;
  }

  if (featureKey === "PDF_REPORT") {
    return period === "day"
      ? config.pdfReportDailyLimit
      : config.pdfReportMonthlyLimit;
  }

  if (featureKey === "MONTHLY_WORDS") {
    return config.monthlyWordLimit;
  }

  return config.monthlyFullCheckLimit;
}

async function getUsageForFeaturePeriod(
  db: Database,
  input: {
    featureKey: FeatureKey;
    now: Date;
    period: FeatureUsagePeriod;
    tenantId: string | null;
  }
): Promise<{
  consumedUnits: number;
  resetAt: Date;
  reservedUnits: number;
}> {
  const window = getPeriodWindow(input.now, input.period);
  const conditions: SQL[] = [
    eq(schema.featureUsageEvents.featureKey, input.featureKey),
    gte(schema.featureUsageEvents.createdAt, window.periodStart),
    sql`${schema.featureUsageEvents.status} IN ('reserved', 'consumed', 'fallback')`
  ];

  if (input.tenantId) {
    conditions.push(eq(schema.featureUsageEvents.tenantId, input.tenantId));
  }

  const [result] = await db
    .select({
      consumedUnits: sql<number>`coalesce(sum(${schema.featureUsageEvents.unitsConsumed}), 0)::int`,
      reservedUnits: sql<number>`coalesce(sum(${schema.featureUsageEvents.unitsReserved}), 0)::int`
    })
    .from(schema.featureUsageEvents)
    .where(and(...conditions));

  return {
    consumedUnits: Number(result.consumedUnits),
    resetAt: window.resetAt,
    reservedUnits: Number(result.reservedUnits)
  };
}

function getPeriodWindow(
  now: Date,
  period: FeatureUsagePeriod
): {
  periodStart: Date;
  resetAt: Date;
} {
  if (period === "minute") {
    const periodStart = new Date(now);
    periodStart.setUTCSeconds(0, 0);
    const resetAt = new Date(periodStart);
    resetAt.setUTCMinutes(resetAt.getUTCMinutes() + 1);

    return {
      periodStart,
      resetAt
    };
  }

  if (period === "day") {
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const resetAt = new Date(periodStart);
    resetAt.setUTCDate(resetAt.getUTCDate() + 1);

    return {
      periodStart,
      resetAt
    };
  }

  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const resetAt = new Date(periodStart);
  resetAt.setUTCMonth(resetAt.getUTCMonth() + 1);

  return {
    periodStart,
    resetAt
  };
}

async function writeBudgetAuditEvent(
  db: Database,
  input: {
    action:
      | "FEATURE_BUDGET_CONSUMED"
      | "FEATURE_BUDGET_EXHAUSTED"
      | "FEATURE_BUDGET_RESERVED"
      | "FEATURE_FALLBACK_USED"
      | "SCAN_BLOCKED_BY_BUDGET";
    eventId: string;
    featureKey: FeatureKey;
    metadata?: Record<string, unknown>;
    submissionId?: string | null;
    tenantId: string;
    units: number;
    userId?: string | null;
  }
): Promise<void> {
  await db.insert(schema.auditEvents).values({
    action: input.action,
    actorUserId: input.userId ?? null,
    entityId: input.eventId,
    entityType: "feature_usage_event",
    metadata: {
      ...(input.metadata ?? {}),
      featureKey: input.featureKey,
      featureLabel: getFeatureLabel(input.featureKey),
      submissionId: input.submissionId ?? null,
      units: input.units
    },
    tenantId: input.tenantId
  });
}

async function countTenants(db: Database): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`count(*)::int`
    })
    .from(schema.tenants);

  return Number(result.total);
}

function buildEstimateItem(
  featureKey: FeatureKey,
  units: number
): FeatureUsageEstimate {
  return {
    featureKey,
    featureLabel: getFeatureLabel(featureKey),
    unitType: getFeatureUnitType(featureKey),
    units: sanitizeUnits(units)
  };
}

function sanitizeUnits(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.ceil(value)) : 0;
}

function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
