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
  )
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
