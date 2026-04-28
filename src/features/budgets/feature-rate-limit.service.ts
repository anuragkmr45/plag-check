import type { Database } from "../../lib/db";
import {
  readFeatureBudgetConfig,
  type FeatureBudgetConfig,
  type FeatureKey
} from "./feature-budget.service";

export type FeatureRateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      message: string;
      resetAt: Date;
    };

type FeatureRateLimitInput = {
  database: Database;
  featureKey: FeatureKey;
  tenantId: string;
  units: number;
};

type FeatureRateLimitOptions = {
  config?: FeatureBudgetConfig;
  now?: Date;
};

const minuteUsage = new Map<
  string,
  {
    resetAt: Date;
    units: number;
  }
>();

export async function checkFeatureRateLimit(
  input: FeatureRateLimitInput,
  options: FeatureRateLimitOptions = {}
): Promise<FeatureRateLimitResult> {
  const config = options.config ?? readFeatureBudgetConfig();

  if (!config.rateLimitsEnabled) {
    return {
      allowed: true
    };
  }

  const minute = checkMinuteFeatureLimit(input, config, options.now ?? new Date());

  if (!minute.allowed) {
    return minute;
  }

  return {
    allowed: true
  };
}

export function resetFeatureRateLimitMemory(): void {
  minuteUsage.clear();
}

function checkMinuteFeatureLimit(
  input: FeatureRateLimitInput,
  config: FeatureBudgetConfig,
  now: Date
): FeatureRateLimitResult {
  if (input.featureKey === "GRAMMAR_REVIEW") {
    return checkGrammarReviewMinuteLimits(input, config, now);
  }

  const limit = getMinuteLimit(input.featureKey, config);

  if (!limit) {
    return {
      allowed: true
    };
  }

  return checkAndConsumeMinuteLimit({
    featureKey: input.featureKey,
    limit,
    measure: "units",
    now,
    tenantId: input.tenantId,
    units: input.units
  });
}

function checkGrammarReviewMinuteLimits(
  input: FeatureRateLimitInput,
  config: FeatureBudgetConfig,
  now: Date
): FeatureRateLimitResult {
  const characterLimit = checkMinuteCapacity({
    featureKey: input.featureKey,
    limit: config.grammarReviewPerMinuteCharacters,
    measure: "characters",
    now,
    tenantId: input.tenantId,
    units: input.units
  });

  if (!characterLimit.allowed) {
    return characterLimit;
  }

  const requestLimit = checkMinuteCapacity({
    featureKey: input.featureKey,
    limit: config.grammarReviewMaxRequestsPerMinute,
    measure: "requests",
    now,
    tenantId: input.tenantId,
    units: 1
  });

  if (!requestLimit.allowed) {
    return {
      ...requestLimit,
      message: "Grammar Review requests per minute are exhausted."
    };
  }

  consumeMinuteCapacity(characterLimit);
  consumeMinuteCapacity(requestLimit);

  return {
    allowed: true
  };
}

function checkAndConsumeMinuteLimit(
  input: MinuteLimitInput
): FeatureRateLimitResult {
  const result = checkMinuteCapacity(input);

  if (!result.allowed) {
    return result;
  }

  consumeMinuteCapacity(result);

  return {
    allowed: true
  };
}

type MinuteLimitInput = {
  featureKey: FeatureKey;
  limit: number;
  measure: string;
  now: Date;
  tenantId: string;
  units: number;
};

type MinuteCapacity =
  | {
      allowed: true;
      key: string;
      resetAt: Date;
      units: number;
    }
  | {
      allowed: false;
      message: string;
      resetAt: Date;
    };

function checkMinuteCapacity(input: MinuteLimitInput): MinuteCapacity {
  const resetAt = getNextMinute(input.now);
  const key = `${input.tenantId}:${input.featureKey}:${input.measure}:${resetAt.toISOString()}`;
  const current = minuteUsage.get(key);
  const currentUnits = current?.units ?? 0;

  if (currentUnits + input.units > input.limit) {
    return {
      allowed: false,
      message: "Per-minute feature capacity is exhausted.",
      resetAt
    };
  }

  return {
    allowed: true,
    key,
    resetAt,
    units: currentUnits + input.units
  };
}

function consumeMinuteCapacity(
  input: Extract<MinuteCapacity, { allowed: true }>
): void {
  minuteUsage.set(input.key, {
    resetAt: input.resetAt,
    units: input.units
  });
}

function getMinuteLimit(
  featureKey: FeatureKey,
  config: FeatureBudgetConfig
): number | null {
  if (featureKey === "WEB_SOURCE_MATCHING") {
    return config.webSourceMatchingPerMinuteUnits;
  }

  if (featureKey === "AI_WRITING_ANALYSIS") {
    return config.aiWritingAnalysisRpm;
  }

  if (featureKey === "ACADEMIC_SOURCE_LOOKUP") {
    return config.academicSourcePerMinuteUnits;
  }

  if (featureKey === "GRAMMAR_REVIEW") {
    return config.grammarReviewPerMinuteCharacters;
  }

  return null;
}

function getNextMinute(now: Date): Date {
  const resetAt = new Date(now);
  resetAt.setUTCSeconds(0, 0);
  resetAt.setUTCMinutes(resetAt.getUTCMinutes() + 1);

  return resetAt;
}
