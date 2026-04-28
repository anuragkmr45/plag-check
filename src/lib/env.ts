import { z } from "zod";

const postgresUrlSchema = z
  .string()
  .url("DATABASE_URL must be a valid URL")
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "postgres:" || protocol === "postgresql:";
    },
    {
      message: "DATABASE_URL must use postgres:// or postgresql://"
    }
  );

const requiredString = z.string().trim().min(1, "Value is required");
const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();
const booleanString = z
  .enum(["true", "false", "1", "0", "yes", "no", "on", "off"])
  .optional()
  .transform((value) => {
    if (!value) {
      return false;
    }

    return ["true", "1", "yes", "on"].includes(value);
  });
const booleanStringDefault = (defaultValue: boolean) =>
  z
    .enum(["true", "false", "1", "0", "yes", "no", "on", "off"])
    .optional()
    .transform((value) => {
      if (!value) {
        return defaultValue;
      }

      return ["true", "1", "yes", "on"].includes(value);
    });
const positiveIntegerString = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((value, context) => {
      if (!value) {
        return defaultValue;
      }

      const parsed = Number(value);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        context.addIssue({
          code: "custom",
          message: "Value must be a positive integer"
        });
        return z.NEVER;
      }

      return parsed;
    });
const scanModeSchema = z.enum(["standard", "deep", "fallback"]);

export const envSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  MINIO_ENDPOINT: z.string().url("MINIO_ENDPOINT must be a valid URL"),
  MINIO_REGION: requiredString,
  MINIO_BUCKET: requiredString,
  MINIO_ACCESS_KEY: requiredString,
  MINIO_SECRET_KEY: requiredString,
  SCAN_PROVIDER: z.enum(["mock", "demo-real"]).optional().default("mock"),
  DEMO_MODE: booleanString,
  SHOW_PROVIDER_LABEL: booleanString,
  ALLOW_FALLBACK: z
    .enum(["true", "false", "1", "0", "yes", "no", "on", "off"])
    .optional()
    .transform((value) => {
      if (!value) {
        return true;
      }

      return ["true", "1", "yes", "on"].includes(value);
    }),
  DEMO_WEB_SEARCH_PROVIDER: z
    .enum(["tavily", "fallback", "disabled"])
    .optional()
    .default("fallback"),
  TAVILY_API_KEY: optionalTrimmedString,
  TAVILY_SEARCH_DEPTH: z
    .enum(["basic", "advanced"])
    .optional()
    .default("basic"),
  TAVILY_MAX_RESULTS: positiveIntegerString(5),
  TAVILY_MAX_CHUNKS: positiveIntegerString(6),
  DEMO_AI_PROVIDER: z
    .enum(["gemini", "heuristic", "disabled"])
    .optional()
    .default("heuristic"),
  DEMO_AI_DETECTION_MODE: z
    .enum(["llm", "heuristic"])
    .optional()
    .default("heuristic"),
  GEMINI_API_KEY: optionalTrimmedString,
  GEMINI_MODEL: optionalTrimmedString.transform(
    (value) => value ?? "gemini-2.0-flash"
  ),
  GEMINI_MAX_OUTPUT_TOKENS: positiveIntegerString(1200),
  DEMO_ACADEMIC_PROVIDER: z
    .enum(["openalex", "fallback", "disabled"])
    .optional()
    .default("fallback"),
  OPENALEX_API_KEY: optionalTrimmedString,
  OPENALEX_MAILTO: optionalTrimmedString,
  OPENALEX_MAX_RESULTS: positiveIntegerString(5),
  DEMO_GRAMMAR_PROVIDER: z
    .enum(["languagetool-public", "fallback", "disabled"])
    .optional()
    .default("fallback"),
  LANGUAGETOOL_URL: z
    .string()
    .url("LANGUAGETOOL_URL must be a valid URL")
    .optional()
    .default("https://api.languagetool.org/v2/check"),
  LANGUAGETOOL_LANGUAGE: optionalTrimmedString.transform(
    (value) => value ?? "en-US"
  ),
  LANGUAGETOOL_MAX_CHARS: positiveIntegerString(20_000),
  MAX_FILE_MB: positiveIntegerString(25),
  MAX_WORDS_PER_DOCUMENT: positiveIntegerString(50_000),
  MONTHLY_WORD_LIMIT: positiveIntegerString(1_000_000),
  ACCEPTED_FILES: optionalTrimmedString.transform(
    (value) => value ?? "pdf,doc,docx,txt"
  ),
  FEATURE_BUDGETS_ENABLED: booleanStringDefault(true),
  FEATURE_RATE_LIMITS_ENABLED: booleanStringDefault(true),
  FEATURE_USAGE_DASHBOARD_ENABLED: booleanStringDefault(true),
  MONTHLY_FULL_CHECK_LIMIT: positiveIntegerString(300),
  MONTHLY_FILE_LIMIT: positiveIntegerString(300),
  MONTHLY_DEEP_CHECK_LIMIT: positiveIntegerString(50),
  WEB_SOURCE_MATCHING_MONTHLY_UNITS: positiveIntegerString(900),
  WEB_SOURCE_MATCHING_DAILY_UNITS: positiveIntegerString(30),
  WEB_SOURCE_MATCHING_PER_MINUTE_UNITS: positiveIntegerString(5),
  WEB_SOURCE_MATCHING_STANDARD_UNITS_PER_SCAN: positiveIntegerString(3),
  WEB_SOURCE_MATCHING_DEEP_UNITS_PER_SCAN: positiveIntegerString(6),
  WEB_SOURCE_MATCHING_RESERVE_UNITS: positiveIntegerString(100),
  AI_WRITING_ANALYSIS_MONTHLY_REQUESTS: positiveIntegerString(300),
  AI_WRITING_ANALYSIS_DAILY_REQUESTS: positiveIntegerString(50),
  AI_WRITING_ANALYSIS_RPM: positiveIntegerString(10),
  AI_WRITING_ANALYSIS_STANDARD_REQUESTS_PER_SCAN: positiveIntegerString(1),
  AI_WRITING_ANALYSIS_MAX_INPUT_TOKENS: positiveIntegerString(8_000),
  AI_WRITING_ANALYSIS_MAX_OUTPUT_TOKENS: positiveIntegerString(1_024),
  AI_WRITING_ANALYSIS_MAX_TOTAL_TOKENS_PER_SCAN: positiveIntegerString(9_024),
  ACADEMIC_SOURCE_MONTHLY_UNITS: positiveIntegerString(600),
  ACADEMIC_SOURCE_DAILY_UNITS: positiveIntegerString(90),
  ACADEMIC_SOURCE_PER_MINUTE_UNITS: positiveIntegerString(20),
  ACADEMIC_SOURCE_STANDARD_UNITS_PER_SCAN: positiveIntegerString(2),
  ACADEMIC_SOURCE_DEEP_UNITS_PER_SCAN: positiveIntegerString(3),
  GRAMMAR_REVIEW_MONTHLY_CHARACTERS: positiveIntegerString(5_400_000),
  GRAMMAR_REVIEW_DAILY_CHARACTERS: positiveIntegerString(180_000),
  GRAMMAR_REVIEW_PER_MINUTE_CHARACTERS: positiveIntegerString(54_000),
  GRAMMAR_REVIEW_STANDARD_CHARS_PER_SCAN: positiveIntegerString(18_000),
  GRAMMAR_REVIEW_DEEP_CHARS_PER_SCAN: positiveIntegerString(36_000),
  GRAMMAR_REVIEW_MAX_REQUESTS_PER_MINUTE: positiveIntegerString(3),
  PDF_REPORT_MONTHLY_LIMIT: positiveIntegerString(500),
  PDF_REPORT_DAILY_LIMIT: positiveIntegerString(50),
  ALLOW_LOCAL_FALLBACK_WHEN_BUDGET_EXHAUSTED: booleanStringDefault(true),
  SHOW_FALLBACK_BADGE: booleanStringDefault(true),
  BLOCK_SCAN_WHEN_ALL_FEATURE_BUDGETS_EXHAUSTED: booleanStringDefault(true),
  DEFAULT_SCAN_MODE: scanModeSchema.optional().default("standard"),
  ENABLE_DEEP_SCAN: booleanStringDefault(true),
  ENABLE_BUDGET_PREVIEW_BEFORE_SCAN: booleanStringDefault(true)
});

export const seedEnvSchema = z.object({
  SEED_SUPER_ADMIN_EMAIL: z
    .string()
    .trim()
    .email("SEED_SUPER_ADMIN_EMAIL must be a valid email")
    .transform((email) => email.toLowerCase()),
  SEED_SUPER_ADMIN_PASSWORD: z
    .string()
    .min(12, "SEED_SUPER_ADMIN_PASSWORD must be at least 12 characters"),
  SEED_DEMO_USER_PASSWORD: z
    .string()
    .min(12, "SEED_DEMO_USER_PASSWORD must be at least 12 characters")
    .optional()
});

export type Env = z.infer<typeof envSchema>;
export type EnvInput = Record<string, string | undefined>;
export type SeedEnv = z.infer<typeof seedEnvSchema>;
export type EnvValidationResult =
  | {
      env: Env;
      success: true;
    }
  | {
      error: Error;
      success: false;
    };
type EnvKey = keyof Env;

export function parseEnv(input: EnvInput): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "environment";
        return `${field}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return result.data;
}

export function parseSeedEnv(input: EnvInput): SeedEnv {
  const result = seedEnvSchema.safeParse(normalizeSeedEnvInput(input));

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "environment";
        return `${field}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(`Invalid seed environment variables:\n${details}`);
  }

  return result.data;
}

function normalizeSeedEnvInput(input: EnvInput): EnvInput {
  return {
    ...input,
    SEED_DEMO_USER_PASSWORD:
      input.SEED_DEMO_USER_PASSWORD ?? input.DEMO_USER_PASSWORD,
    SEED_SUPER_ADMIN_EMAIL:
      input.SEED_SUPER_ADMIN_EMAIL ?? input.SUPER_ADMIN_EMAIL,
    SEED_SUPER_ADMIN_PASSWORD:
      input.SEED_SUPER_ADMIN_PASSWORD ?? input.SUPER_ADMIN_PASSWORD
  };
}

let cachedEnv: Env | undefined;
let cachedSeedEnv: SeedEnv | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}

export function getSeedEnv(): SeedEnv {
  cachedSeedEnv ??= parseSeedEnv(process.env);
  return cachedSeedEnv;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function validateCurrentEnv(): EnvValidationResult {
  try {
    return {
      env: getEnv(),
      success: true
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Invalid environment"),
      success: false
    };
  }
}

const envProxyHandler: ProxyHandler<Env> = {
  get(_target, property) {
    if (typeof property !== "string" || !(property in envSchema.shape)) {
      return undefined;
    }

    return getEnv()[property as EnvKey];
  }
};

export const env: Env = new Proxy({} as Env, envProxyHandler);
