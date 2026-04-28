import { beforeEach, describe, expect, it } from "vitest";
import {
  capTextToAiInputBudget,
  calculateBudgetState,
  estimateAiInputTokens,
  estimateScanUsage,
  getGrammarCharacterLimitForScanMode,
  getFeatureLabel,
  shouldBlockScanWhenAllExternalFeatureBudgetsExhausted,
  type FeatureBudgetConfig,
  type FeatureKey
} from "../src/features/budgets/feature-budget.service";
import {
  checkFeatureRateLimit,
  resetFeatureRateLimitMemory
} from "../src/features/budgets/feature-rate-limit.service";
import type { Database } from "../src/lib/db";

const config = {
  academicSourceDailyUnits: 90,
  academicSourceDeepUnitsPerScan: 3,
  academicSourceMonthlyUnits: 600,
  academicSourcePerMinuteUnits: 20,
  academicSourceStandardUnitsPerScan: 2,
  aiWritingAnalysisDailyRequests: 50,
  aiWritingAnalysisMaxInputTokens: 8_000,
  aiWritingAnalysisMaxOutputTokens: 1_024,
  aiWritingAnalysisMaxTotalTokensPerScan: 9_024,
  aiWritingAnalysisMonthlyRequests: 300,
  aiWritingAnalysisRpm: 10,
  aiWritingAnalysisStandardRequestsPerScan: 1,
  allowLocalFallbackWhenBudgetExhausted: true,
  blockScanWhenAllFeatureBudgetsExhausted: true,
  budgetsEnabled: true,
  defaultScanMode: "standard",
  enableBudgetPreviewBeforeScan: true,
  enableDeepScan: true,
  featureUsageDashboardEnabled: true,
  grammarReviewDailyCharacters: 180_000,
  grammarReviewDeepCharsPerScan: 36_000,
  grammarReviewMaxRequestsPerMinute: 3,
  grammarReviewMonthlyCharacters: 5_400_000,
  grammarReviewPerMinuteCharacters: 54_000,
  grammarReviewStandardCharsPerScan: 18_000,
  monthlyDeepCheckLimit: 50,
  monthlyFileLimit: 300,
  monthlyFullCheckLimit: 300,
  monthlyWordLimit: 1_000_000,
  pdfReportDailyLimit: 50,
  pdfReportMonthlyLimit: 500,
  rateLimitsEnabled: true,
  showFallbackBadge: true,
  webSourceMatchingDailyUnits: 30,
  webSourceMatchingDeepUnitsPerScan: 6,
  webSourceMatchingMonthlyUnits: 900,
  webSourceMatchingPerMinuteUnits: 5,
  webSourceMatchingReserveUnits: 100,
  webSourceMatchingStandardUnitsPerScan: 3
} satisfies FeatureBudgetConfig;

function usageMap(
  estimate: ReturnType<typeof estimateScanUsage>
): Record<FeatureKey, number> {
  return Object.fromEntries(
    estimate.items.map((item) => [item.featureKey, item.units])
  ) as Record<FeatureKey, number>;
}

describe("feature budget estimates", () => {
  beforeEach(() => {
    resetFeatureRateLimitMemory();
  });

  it("estimates standard scan usage from research defaults", () => {
    const estimate = usageMap(
      estimateScanUsage(
        {
          charCount: 22_000,
          scanMode: "standard",
          wordCount: 1_200
        },
        config
      )
    );

    expect(estimate.FULL_CHECK).toBe(1);
    expect(estimate.WEB_SOURCE_MATCHING).toBe(3);
    expect(estimate.AI_WRITING_ANALYSIS).toBe(1);
    expect(estimate.ACADEMIC_SOURCE_LOOKUP).toBe(2);
    expect(estimate.GRAMMAR_REVIEW).toBe(18_000);
    expect(estimate.MONTHLY_WORDS).toBe(1_200);
  });

  it("estimates deep scan usage with higher feature units", () => {
    const estimate = usageMap(
      estimateScanUsage(
        {
          charCount: 40_000,
          scanMode: "deep",
          wordCount: 2_000
        },
        config
      )
    );

    expect(estimate.FULL_CHECK).toBe(2);
    expect(estimate.WEB_SOURCE_MATCHING).toBe(6);
    expect(estimate.ACADEMIC_SOURCE_LOOKUP).toBe(3);
    expect(estimate.GRAMMAR_REVIEW).toBe(36_000);
  });

  it("blocks only when all external feature budgets are exhausted", () => {
    const estimate = estimateScanUsage(
      {
        charCount: 10_000,
        scanMode: "standard",
        wordCount: 800
      },
      config
    );

    expect(
      shouldBlockScanWhenAllExternalFeatureBudgetsExhausted(
        estimate,
        {
          ACADEMIC_SOURCE_LOOKUP: 0,
          AI_WRITING_ANALYSIS: 0,
          GRAMMAR_REVIEW: 0,
          WEB_SOURCE_MATCHING: 0
        },
        config
      )
    ).toBe(true);
    expect(
      shouldBlockScanWhenAllExternalFeatureBudgetsExhausted(
        estimate,
        {
          ACADEMIC_SOURCE_LOOKUP: 0,
          AI_WRITING_ANALYSIS: 1,
          GRAMMAR_REVIEW: 0,
          WEB_SOURCE_MATCHING: 0
        },
        config
      )
    ).toBe(false);
  });

  it("calculates dashboard budget state", () => {
    expect(calculateBudgetState(820, 900)).toMatchObject({
      critical: false,
      remaining: 80,
      warning: true
    });
    expect(calculateBudgetState(870, 900)).toMatchObject({
      critical: true,
      remaining: 30,
      warning: true
    });
  });

  it("keeps user-facing budget labels free of vendor and API names", () => {
    const forbidden = /(tavily|gemini|openalex|languagetool|api|provider)/i;

    for (const key of [
      "FULL_CHECK",
      "WEB_SOURCE_MATCHING",
      "AI_WRITING_ANALYSIS",
      "ACADEMIC_SOURCE_LOOKUP",
      "GRAMMAR_REVIEW",
      "PDF_REPORT",
      "FALLBACK_SCAN",
      "MONTHLY_WORDS"
    ] as const) {
      expect(getFeatureLabel(key)).not.toMatch(forbidden);
    }
  });

  it("enforces AI input and output caps", () => {
    const text = "x".repeat(50_000);
    const capped = capTextToAiInputBudget(text, config);

    expect(estimateAiInputTokens(capped)).toBeLessThanOrEqual(8_000);
    expect(config.aiWritingAnalysisMaxOutputTokens).toBe(1_024);
  });

  it("enforces grammar character caps by scan mode", () => {
    expect(getGrammarCharacterLimitForScanMode("standard", config)).toBe(18_000);
    expect(getGrammarCharacterLimitForScanMode("deep", config)).toBe(36_000);
  });

  it("fits 300 standard scans inside 900 Web Source Matching units", () => {
    const estimate = usageMap(
      estimateScanUsage(
        {
          charCount: 12_000,
          scanMode: "standard",
          wordCount: 1_000
        },
        config
      )
    );

    expect(estimate.WEB_SOURCE_MATCHING * 300).toBe(900);
  });

  it("enforces Grammar Review max requests per minute", async () => {
    const database = {} as Database;
    const now = new Date("2026-04-28T06:00:00.000Z");

    for (let index = 0; index < 3; index += 1) {
      await expect(
        checkFeatureRateLimit(
          {
            database,
            featureKey: "GRAMMAR_REVIEW",
            tenantId: "tenant-1",
            units: 100
          },
          {
            config,
            now
          }
        )
      ).resolves.toMatchObject({
        allowed: true
      });
    }

    await expect(
      checkFeatureRateLimit(
        {
          database,
          featureKey: "GRAMMAR_REVIEW",
          tenantId: "tenant-1",
          units: 100
        },
        {
          config,
          now
        }
      )
    ).resolves.toMatchObject({
      allowed: false,
      message: "Grammar Review requests per minute are exhausted."
    });
  });
});
