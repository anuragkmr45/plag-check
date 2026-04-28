import { and, count, eq, gte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";
import { USER_ROLES, type UserRole } from "../../lib/rbac/roles";
import type { SubmissionStatus } from "../../server/services/submissions.service";

export const DEFAULT_MONTHLY_WORD_LIMIT = 1_000_000;
export const DEFAULT_SUBMISSION_LIMIT = 300;
export const HIGH_SIMILARITY_THRESHOLD = 50;
export const HIGH_AI_PROBABILITY_THRESHOLD = 0.8;

export type AnalyticsScope = {
  isGlobal: boolean;
  tenantId: string | null;
};

export type AdminAnalytics = {
  generatedAt: string;
  highAiProbabilityCount: number;
  highSimilarityCount: number;
  monthStart: string;
  scansCompletedThisMonth: number;
  scope: AnalyticsScope;
  submissionsByStatus: Record<SubmissionStatus, number>;
  thresholds: {
    highAiProbability: number;
    highSimilarity: number;
  };
  totalSubmissions: number;
  usage: {
    monthlyWordLimit: number;
    submissionLimit: number;
    submissionUsagePercent: number;
    submissionsUsed: number;
    wordUsagePercent: number;
    wordsProcessedThisMonth: number;
  };
  usersByRole: Record<UserRole, number>;
  wordsProcessedThisMonth: number;
};

type AdminAnalyticsOptions = {
  database?: Database;
  now?: Date;
  tenantId?: string;
};

type UsageLimits = {
  monthlyWordLimit: number;
  submissionLimit: number;
};

const tenantLimitSettingsSchema = z
  .object({
    limits: z
      .object({
        monthlyWordLimit: z.number().int().positive().optional(),
        monthlyWordLimitWords: z.number().int().positive().optional(),
        submissionLimit: z.number().int().positive().optional()
      })
      .optional(),
    monthlyWordLimit: z.number().int().positive().optional(),
    monthlyWordLimitWords: z.number().int().positive().optional(),
    submissionLimit: z.number().int().positive().optional()
  })
  .passthrough();

export async function getAdminAnalytics(
  user: RbacUser,
  options: AdminAnalyticsOptions = {}
): Promise<AdminAnalytics> {
  const db = options.database ?? getDatabase();
  const now = options.now ?? new Date();
  const monthStart = getUtcMonthStart(now);
  const scope = resolveAnalyticsScope(user, options.tenantId);
  const submissionConditions = submissionTenantConditions(scope);
  const scanConditions = scanTenantConditions(scope);
  const monthConditions = [
    ...scanConditions,
    gte(schema.scanResults.createdAt, monthStart)
  ];
  const [
    totalSubmissions,
    submissionsByStatus,
    scansCompletedThisMonth,
    wordsProcessedThisMonth,
    highSimilarityCount,
    highAiProbabilityCount,
    usersByRole,
    usageLimits
  ] = await Promise.all([
    countRows(db, schema.submissions, submissionConditions),
    getSubmissionsByStatus(db, submissionConditions),
    countRows(db, schema.scanResults, monthConditions),
    sumScannedWords(db, monthConditions),
    countRows(db, schema.scanResults, [
      ...scanConditions,
      sql`${schema.scanResults.similarityScore} >= ${HIGH_SIMILARITY_THRESHOLD}`
    ]),
    countRows(db, schema.scanResults, [
      ...scanConditions,
      sql`${schema.scanResults.aiProbability} >= ${HIGH_AI_PROBABILITY_THRESHOLD}`
    ]),
    getUsersByRole(db, scope),
    getUsageLimits(db, scope)
  ]);

  return {
    generatedAt: now.toISOString(),
    highAiProbabilityCount,
    highSimilarityCount,
    monthStart: monthStart.toISOString(),
    scansCompletedThisMonth,
    scope,
    submissionsByStatus,
    thresholds: {
      highAiProbability: HIGH_AI_PROBABILITY_THRESHOLD,
      highSimilarity: HIGH_SIMILARITY_THRESHOLD
    },
    totalSubmissions,
    usage: {
      monthlyWordLimit: usageLimits.monthlyWordLimit,
      submissionLimit: usageLimits.submissionLimit,
      submissionUsagePercent: calculateUsagePercent(
        totalSubmissions,
        usageLimits.submissionLimit
      ),
      submissionsUsed: totalSubmissions,
      wordUsagePercent: calculateUsagePercent(
        wordsProcessedThisMonth,
        usageLimits.monthlyWordLimit
      ),
      wordsProcessedThisMonth
    },
    usersByRole,
    wordsProcessedThisMonth
  };
}

export function resolveAnalyticsScope(
  user: RbacUser,
  requestedTenantId?: string
): AnalyticsScope {
  if (user.role === "SUPER_ADMIN") {
    return {
      isGlobal: !requestedTenantId,
      tenantId: requestedTenantId ?? null
    };
  }

  if (user.role !== "INSTITUTION_ADMIN" || !user.tenantId) {
    throw new AuthorizationError("Analytics access denied");
  }

  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    throw new AuthorizationError("Analytics tenant access denied");
  }

  return {
    isGlobal: false,
    tenantId: user.tenantId
  };
}

export function resolveUsageLimitsFromSettings(settings: unknown): UsageLimits {
  const parsedSettings = tenantLimitSettingsSchema.safeParse(settings);

  if (!parsedSettings.success) {
    return defaultUsageLimits();
  }

  const limitSettings = parsedSettings.data.limits ?? parsedSettings.data;

  return {
    monthlyWordLimit:
      limitSettings.monthlyWordLimit ??
      limitSettings.monthlyWordLimitWords ??
      DEFAULT_MONTHLY_WORD_LIMIT,
    submissionLimit: limitSettings.submissionLimit ?? DEFAULT_SUBMISSION_LIMIT
  };
}

export function buildSubmissionStatusCounts(
  rows: Array<{
    count: number;
    status: SubmissionStatus;
  }>
): Record<SubmissionStatus, number> {
  const counts = Object.fromEntries(
    schema.submissionStatus.enumValues.map((status) => [status, 0])
  ) as Record<SubmissionStatus, number>;

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
}

export function buildUserRoleCounts(
  rows: Array<{
    count: number;
    role: UserRole;
  }>
): Record<UserRole, number> {
  const counts = Object.fromEntries(
    USER_ROLES.map((role) => [role, 0])
  ) as Record<UserRole, number>;

  for (const row of rows) {
    counts[row.role] = row.count;
  }

  return counts;
}

export function calculateUsagePercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }

  return Number(Math.min(100, (used / limit) * 100).toFixed(2));
}

export function getUtcMonthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function submissionTenantConditions(scope: AnalyticsScope): SQL[] {
  return scope.tenantId ? [eq(schema.submissions.tenantId, scope.tenantId)] : [];
}

function scanTenantConditions(scope: AnalyticsScope): SQL[] {
  return scope.tenantId ? [eq(schema.scanResults.tenantId, scope.tenantId)] : [];
}

async function countRows(
  db: Database,
  table: typeof schema.submissions | typeof schema.scanResults,
  conditions: SQL[]
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(table)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result.count;
}

async function getSubmissionsByStatus(
  db: Database,
  conditions: SQL[]
): Promise<Record<SubmissionStatus, number>> {
  const rows = await db
    .select({
      count: count(),
      status: schema.submissions.status
    })
    .from(schema.submissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(schema.submissions.status);

  return buildSubmissionStatusCounts(rows);
}

async function sumScannedWords(
  db: Database,
  conditions: SQL[]
): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${schema.scanResults.scannedWordCount}), 0)::int`
    })
    .from(schema.scanResults)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return Number(result.total);
}

async function getUsersByRole(
  db: Database,
  scope: AnalyticsScope
): Promise<Record<UserRole, number>> {
  const conditions = scope.tenantId ? [eq(schema.users.tenantId, scope.tenantId)] : [];
  const rows = await db
    .select({
      count: count(),
      role: schema.users.role
    })
    .from(schema.users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(schema.users.role);

  return buildUserRoleCounts(rows);
}

async function getUsageLimits(
  db: Database,
  scope: AnalyticsScope
): Promise<UsageLimits> {
  if (scope.tenantId) {
    const [settings] = await db
      .select({
        settings: schema.tenantSettings.settings
      })
      .from(schema.tenantSettings)
      .where(eq(schema.tenantSettings.tenantId, scope.tenantId))
      .limit(1);

    return resolveUsageLimitsFromSettings(settings?.settings);
  }

  const tenantRows = await db
    .select({
      settings: schema.tenantSettings.settings,
      tenantId: schema.tenants.id
    })
    .from(schema.tenants)
    .leftJoin(
      schema.tenantSettings,
      eq(schema.tenantSettings.tenantId, schema.tenants.id)
    );

  if (tenantRows.length === 0) {
    return defaultUsageLimits();
  }

  return tenantRows.reduce<UsageLimits>(
    (totals, row) => {
      const limits = resolveUsageLimitsFromSettings(row.settings);

      return {
        monthlyWordLimit: totals.monthlyWordLimit + limits.monthlyWordLimit,
        submissionLimit: totals.submissionLimit + limits.submissionLimit
      };
    },
    {
      monthlyWordLimit: 0,
      submissionLimit: 0
    }
  );
}

function defaultUsageLimits(): UsageLimits {
  return {
    monthlyWordLimit: DEFAULT_MONTHLY_WORD_LIMIT,
    submissionLimit: DEFAULT_SUBMISSION_LIMIT
  };
}
