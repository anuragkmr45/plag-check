import { z } from "zod";
import {
  capTextToAiInputBudget,
  consumeFeatureUsage,
  estimateScanUsage,
  getGrammarCharacterLimitForScanMode,
  readFeatureBudgetConfig,
  recordFallbackUsage,
  reserveFeatureUsage,
  type FeatureBudgetConfig,
  type FeatureKey
} from "../../budgets/feature-budget.service";
import { env } from "../../../lib/env";
import type {
  ScanAiAssessment,
  ScanGrammarFinding,
  ScanProvider,
  ScanProviderInput,
  ScanProviderResult,
  ScanSourceMatch
} from "./types";

type DemoRealScanProviderConfig = {
  allowFallback: boolean;
  budgetEnforcement?: boolean;
  demoAcademicProvider: "openalex" | "fallback" | "disabled";
  demoAiDetectionMode: "llm" | "heuristic";
  demoAiProvider: "gemini" | "heuristic" | "disabled";
  demoGrammarProvider: "languagetool-public" | "fallback" | "disabled";
  demoWebSearchProvider: "tavily" | "fallback" | "disabled";
  geminiApiKey?: string;
  geminiMaxOutputTokens: number;
  geminiModel: string;
  languageToolLanguage: string;
  languageToolMaxChars: number;
  languageToolUrl: string;
  openAlexApiKey?: string;
  openAlexMailto?: string;
  openAlexMaxResults: number;
  tavilyApiKey?: string;
  tavilyMaxChunks: number;
  tavilyMaxResults: number;
  tavilySearchDepth: "basic" | "advanced";
  featureBudgetConfig?: FeatureBudgetConfig;
};

type TextChunk = {
  endChar: number;
  index: number;
  startChar: number;
  text: string;
};

type ProviderStatus = {
  fallback: boolean;
  provider: string;
  reason?: string;
  resultCount?: number;
};

type AcademicMetadataMatch = {
  abstractSnippet: string | null;
  authors: string[];
  doi: string | null;
  openAlexUrl: string | null;
  publicationYear: number | null;
  source: string | null;
  title: string;
};

type WebScanResult = {
  matches: ScanSourceMatch[];
  metadataMatches: Array<{
    chunkIndex: number;
    provider: string;
    snippet: string;
    sourceTitle: string;
    sourceUrl: string | null;
  }>;
  status: ProviderStatus;
};

type AiScanResult = {
  assessments: ScanAiAssessment[];
  confidenceBand: "low" | "medium" | "high";
  notes: string[];
  probability: number;
  status: ProviderStatus;
};

type AcademicScanResult = {
  matches: AcademicMetadataMatch[];
  status: ProviderStatus;
};

type GrammarScanResult = {
  findings: ScanGrammarFinding[];
  status: ProviderStatus;
};

const fallbackDemoSources = [
  {
    phrase: "academic integrity",
    sourceTitle: "Demo Web Source: Academic Integrity Overview",
    sourceUrl: "https://example.invalid/demo/academic-integrity"
  },
  {
    phrase: "plagiarism detection",
    sourceTitle: "Demo Web Source: Similarity Detection Methods",
    sourceUrl: "https://example.invalid/demo/plagiarism-detection"
  },
  {
    phrase: "generative ai",
    sourceTitle: "Demo Web Source: Generative AI Writing Indicators",
    sourceUrl: "https://example.invalid/demo/generative-ai"
  },
  {
    phrase: "machine learning",
    sourceTitle: "Demo Web Source: Machine Learning Summary",
    sourceUrl: "https://example.invalid/demo/machine-learning"
  }
] as const;

const commonMisspellings = [
  {
    message: "Possible typo: teh",
    pattern: /\bteh\b/gi,
    replacementSuggestions: ["the"]
  },
  {
    message: "Possible typo: recieve",
    pattern: /\brecieve\b/gi,
    replacementSuggestions: ["receive"]
  },
  {
    message: "Possible typo: seperate",
    pattern: /\bseperate\b/gi,
    replacementSuggestions: ["separate"]
  },
  {
    message: "Possible typo: goverment",
    pattern: /\bgoverment\b/gi,
    replacementSuggestions: ["government"]
  }
] as const;

const geminiAssessmentSchema = z.object({
  aiProbability: z.number(),
  confidenceBand: z.enum(["low", "medium", "high"]),
  sentenceAssessments: z
    .array(
      z.object({
        probability: z.number(),
        reason: z.string().trim().min(1),
        text: z.string().trim().min(1)
      })
    )
    .default([]),
  writingPatternNotes: z.array(z.string().trim().min(1)).default([])
});

const tavilyResponseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            content: z.string().optional().default(""),
            score: z.number().optional().default(0),
            title: z.string().optional().default("Untitled web source"),
            url: z.string().url().optional().nullable()
          })
          .passthrough()
      )
      .default([]),
    usage: z.unknown().optional()
  })
  .passthrough();

const openAlexResponseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            abstract_inverted_index: z.record(z.string(), z.array(z.number())).nullable().optional(),
            authorships: z
              .array(
                z
                  .object({
                    author: z
                      .object({
                        display_name: z.string().nullable().optional()
                      })
                      .optional()
                  })
                  .passthrough()
              )
              .optional()
              .default([]),
            display_name: z.string().nullable().optional(),
            doi: z.string().nullable().optional(),
            id: z.string().nullable().optional(),
            primary_location: z
              .object({
                source: z
                  .object({
                    display_name: z.string().nullable().optional()
                  })
                  .nullable()
                  .optional()
              })
              .nullable()
              .optional(),
            publication_year: z.number().int().nullable().optional(),
            title: z.string().nullable().optional()
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

const languageToolResponseSchema = z
  .object({
    matches: z
      .array(
        z
          .object({
            length: z.number().int().nonnegative(),
            message: z.string(),
            offset: z.number().int().nonnegative(),
            replacements: z
              .array(
                z.object({
                  value: z.string()
                })
              )
              .optional()
              .default([]),
            rule: z
              .object({
                category: z
                  .object({
                    id: z.string().optional(),
                    name: z.string().optional()
                  })
                  .optional(),
                id: z.string().optional()
              })
              .optional()
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

export const demoRealScanProvider: ScanProvider = {
  id: "demo-real",
  async scan(input: ScanProviderInput): Promise<ScanProviderResult> {
    return createDemoRealScanProvider(readDemoRealConfig()).scan(input);
  }
};

export function createDemoRealScanProvider(
  config: DemoRealScanProviderConfig
): ScanProvider {
  return {
    id: "demo-real",
    async scan(input: ScanProviderInput): Promise<ScanProviderResult> {
      const chunks = buildTextChunks(input.text, config.tavilyMaxChunks);
      const [web, ai, academic, grammar] = await Promise.all([
        scanWebSources(input, chunks, config),
        scanAiLikelihood(input, config),
        scanAcademicMetadata(input, chunks, config),
        scanGrammar(input, config)
      ]);
      const similarityScore = calculateSimilarityScore(
        web.matches,
        academic.matches.length
      );
      const fallback =
        web.status.fallback ||
        ai.status.fallback ||
        academic.status.fallback ||
        grammar.status.fallback;

      return {
        aiAssessments: ai.assessments,
        aiProbability: ai.probability,
        grammarFindings: grammar.findings,
        providerMetadata: {
          academicMatches: academic.matches,
          aiConfidenceBand: ai.confidenceBand,
          demoDisclaimer:
            "Demo Real uses Tavily, Gemini, OpenAlex, and LanguageTool/free APIs when configured. Results are for demonstration and review support only, not certified plagiarism proof.",
          fallback,
          generatedAt: new Date().toISOString(),
          originalWordCount: input.originalWordCount,
          provider: "demo-real",
          scannedWordCount: input.scannedWordCount,
          subproviders: {
            academic: academic.status,
            ai: ai.status,
            grammar: grammar.status,
            web: web.status
          },
          webMatches: web.metadataMatches,
          writingPatternNotes: ai.notes
        },
        similarityScore,
        sourceMatches: web.matches
      };
    }
  };
}

export function readDemoRealConfig(): DemoRealScanProviderConfig {
  return {
    allowFallback: env.ALLOW_FALLBACK,
    budgetEnforcement: env.FEATURE_BUDGETS_ENABLED,
    demoAcademicProvider: env.DEMO_ACADEMIC_PROVIDER,
    demoAiDetectionMode: env.DEMO_AI_DETECTION_MODE,
    demoAiProvider: env.DEMO_AI_PROVIDER,
    demoGrammarProvider: env.DEMO_GRAMMAR_PROVIDER,
    demoWebSearchProvider: env.DEMO_WEB_SEARCH_PROVIDER,
    geminiApiKey: normalizeOptionalSecret(env.GEMINI_API_KEY),
    geminiMaxOutputTokens: env.GEMINI_MAX_OUTPUT_TOKENS,
    geminiModel: env.GEMINI_MODEL,
    languageToolLanguage: env.LANGUAGETOOL_LANGUAGE,
    languageToolMaxChars: env.LANGUAGETOOL_MAX_CHARS,
    languageToolUrl: env.LANGUAGETOOL_URL,
    openAlexApiKey: normalizeOptionalSecret(env.OPENALEX_API_KEY),
    openAlexMailto: env.OPENALEX_MAILTO,
    openAlexMaxResults: env.OPENALEX_MAX_RESULTS,
    tavilyApiKey: normalizeOptionalSecret(env.TAVILY_API_KEY),
    tavilyMaxChunks: env.TAVILY_MAX_CHUNKS,
    tavilyMaxResults: env.TAVILY_MAX_RESULTS,
    tavilySearchDepth: env.TAVILY_SEARCH_DEPTH,
    featureBudgetConfig: readFeatureBudgetConfig()
  };
}

async function scanWebSources(
  input: ScanProviderInput,
  chunks: TextChunk[],
  config: DemoRealScanProviderConfig
): Promise<WebScanResult> {
  const text = input.text;

  if (
    input.scanMode === "fallback" ||
    config.demoWebSearchProvider !== "tavily" ||
    !config.tavilyApiKey ||
    chunks.length === 0
  ) {
    return fallbackWebScan(text, "Web Source Matching is using local fallback");
  }

  const reservation = await reserveProviderFeatureUsage(
    input,
    config,
    "WEB_SOURCE_MATCHING"
  );

  if (!reservation.allowed) {
    return fallbackWebScan(text, reservation.reason);
  }

  try {
    const matches: ScanSourceMatch[] = [];
    const metadataMatches: WebScanResult["metadataMatches"] = [];
    const seen = new Set<string>();

    for (const chunk of chunks) {
      const response = await fetchJson("https://api.tavily.com/search", {
        body: JSON.stringify({
          include_answer: false,
          max_results: config.tavilyMaxResults,
          query: buildProviderSearchQuery(chunk.text, 380),
          search_depth: config.tavilySearchDepth
        }),
        headers: {
          Authorization: `Bearer ${config.tavilyApiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const parsed = tavilyResponseSchema.parse(response);

      for (const result of parsed.results) {
        const sourceKey = `${result.url ?? ""}:${result.title}`;

        if (seen.has(sourceKey)) {
          continue;
        }

        seen.add(sourceKey);
        const score = clampScore(62 + result.score * 35);
        matches.push({
          endChar: chunk.endChar,
          matchedText: chunk.text,
          similarityScore: score,
          sourceTitle: result.title,
          sourceUrl: result.url ?? null,
          startChar: chunk.startChar
        });
        metadataMatches.push({
          chunkIndex: chunk.index,
          provider: "tavily",
          snippet: result.content.slice(0, 700),
          sourceTitle: result.title,
          sourceUrl: result.url ?? null
        });
      }
    }

    await consumeFeatureUsage({
      metadata: {
        resultCount: matches.length
      },
      reservationId: reservation.reservationId
    });

    return {
      matches: matches
        .sort((left, right) => right.similarityScore - left.similarityScore)
        .slice(0, config.tavilyMaxResults * Math.max(1, chunks.length)),
      metadataMatches,
      status: {
        fallback: false,
        provider: "tavily",
        resultCount: matches.length
      }
    };
  } catch (error) {
    await consumeFeatureUsage({
      metadata: {
        fallbackReason: getSafeErrorReason(error)
      },
      reservationId: reservation.reservationId
    });
    return fallbackWebScan(text, getSafeErrorReason(error));
  }
}

function fallbackWebScan(text: string, reason: string): WebScanResult {
  const lowerText = text.toLowerCase();
  const matches: ScanSourceMatch[] = [];

  for (const source of fallbackDemoSources) {
    let searchStart = 0;

    while (searchStart < lowerText.length) {
      const startChar = lowerText.indexOf(source.phrase, searchStart);

      if (startChar === -1) {
        break;
      }

      const endChar = startChar + source.phrase.length;
      matches.push({
        endChar,
        matchedText: text.slice(startChar, endChar),
        similarityScore: clampScore(68 + source.phrase.length),
        sourceTitle: source.sourceTitle,
        sourceUrl: source.sourceUrl,
        startChar
      });
      searchStart = endChar;
    }
  }

  return {
    matches,
    metadataMatches: matches.map((match, index) => ({
      chunkIndex: index,
      provider: "fallback",
      snippet: match.matchedText,
      sourceTitle: match.sourceTitle,
      sourceUrl: match.sourceUrl
    })),
    status: {
      fallback: true,
      provider: "tavily",
      reason,
      resultCount: matches.length
    }
  };
}

function buildProviderSearchQuery(text: string, maxLength: number): string {
  const normalized = text
    .replace(/`+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[-*#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");

  return clipped.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim();
}

async function scanAiLikelihood(
  input: ScanProviderInput,
  config: DemoRealScanProviderConfig
): Promise<AiScanResult> {
  const text = input.text;

  if (
    input.scanMode === "fallback" ||
    config.demoAiProvider !== "gemini" ||
    config.demoAiDetectionMode !== "llm" ||
    !config.geminiApiKey
  ) {
    return {
      ...heuristicAiScan(text),
      status: {
        fallback: true,
        provider: "gemini",
        reason: "Gemini API key or provider setting is missing"
      }
    };
  }

  const reservation = await reserveProviderFeatureUsage(
    input,
    config,
    "AI_WRITING_ANALYSIS"
  );

  if (!reservation.allowed) {
    return {
      ...heuristicAiScan(text),
      status: {
        fallback: true,
        provider: "gemini",
        reason: reservation.reason
      }
    };
  }

  try {
    const budgetConfig = config.featureBudgetConfig ?? readFeatureBudgetConfig();
    const cappedText = capTextToAiInputBudget(text, budgetConfig);
    const response = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        config.geminiModel
      )}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildGeminiPrompt(cappedText)
                }
              ],
              role: "user"
            }
          ],
          generationConfig: {
            maxOutputTokens: Math.min(
              config.geminiMaxOutputTokens,
              budgetConfig.aiWritingAnalysisMaxOutputTokens
            ),
            responseMimeType: "application/json",
            temperature: 0.1
          }
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const parsedText = extractGeminiText(response);
    const parsed = geminiAssessmentSchema.parse(JSON.parse(parsedText));
    const sentenceRanges = splitSentences(text);
    const assessments = parsed.sentenceAssessments
      .slice(0, 8)
      .map((assessment, index): ScanAiAssessment => {
        const range =
          findSentenceRange(text, assessment.text) ?? sentenceRanges[index] ?? {
            endChar: Math.min(text.length, assessment.text.length),
            startChar: 0,
            text: assessment.text
          };
        const probability = normalizeProbability(assessment.probability);

        return {
          explanation: assessment.reason,
          label: probability >= 0.65 ? "likely_ai" : "likely_human",
          probability,
          sentenceEndChar: range.endChar,
          sentenceStartChar: range.startChar
        };
      });

    await consumeFeatureUsage({
      metadata: {
        inputTokens: Math.ceil(cappedText.length / 4),
        outputTokenLimit: Math.min(
          config.geminiMaxOutputTokens,
          budgetConfig.aiWritingAnalysisMaxOutputTokens
        ),
        resultCount: assessments.length
      },
      reservationId: reservation.reservationId
    });

    return {
      assessments,
      confidenceBand: parsed.confidenceBand,
      notes: parsed.writingPatternNotes,
      probability: normalizeProbability(parsed.aiProbability),
      status: {
        fallback: false,
        provider: "gemini",
        resultCount: assessments.length
      }
    };
  } catch (error) {
    await consumeFeatureUsage({
      metadata: {
        fallbackReason: getSafeErrorReason(error)
      },
      reservationId: reservation.reservationId
    });
    return {
      ...heuristicAiScan(text),
      status: {
        fallback: true,
        provider: "gemini",
        reason: getSafeErrorReason(error)
      }
    };
  }
}

function heuristicAiScan(
  text: string
): Omit<AiScanResult, "status"> {
  const sentences = splitSentences(text).slice(0, 8);
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);
  const uniqueWordRatio = words.length > 0 ? new Set(words).size / words.length : 1;
  const sentenceLengths = sentences.map((sentence) => countWords(sentence.text));
  const averageLength =
    sentenceLengths.reduce((sum, length) => sum + length, 0) /
    Math.max(1, sentenceLengths.length);
  const lengthVariance =
    sentenceLengths.reduce(
      (sum, length) => sum + Math.abs(length - averageLength),
      0
    ) / Math.max(1, sentenceLengths.length);
  const lowerText = text.toLowerCase();
  const repeatedTransitions = [
    "in conclusion",
    "furthermore",
    "moreover",
    "it is important to note",
    "as a result"
  ].filter((phrase) => lowerText.includes(phrase)).length;
  const lowBurstiness = lengthVariance < 5 && sentences.length >= 3;
  const templateLike =
    repeatedTransitions >= 2 || /this essay (will|aims to)/i.test(text);
  const score = clampProbability(
    0.18 +
      (lowBurstiness ? 0.22 : 0) +
      (templateLike ? 0.24 : 0) +
      (uniqueWordRatio < 0.45 ? 0.18 : 0) +
      Math.min(0.18, repeatedTransitions * 0.06)
  );
  const notes = [
    lowBurstiness
      ? "Sentence lengths are unusually consistent."
      : "Sentence length variation does not strongly indicate templated writing.",
    uniqueWordRatio < 0.45
      ? "Lexical diversity is low for the submitted excerpt."
      : "Lexical diversity is within the expected demo range.",
    templateLike
      ? "Generic transition or conclusion phrases appear repeatedly."
      : "Few repeated generic transition phrases were detected."
  ];

  return {
    assessments: sentences.map((sentence) => {
      const lowerSentence = sentence.text.toLowerCase();
      const sentenceScore = clampProbability(
        score +
          (lowerSentence.includes("in conclusion") ? 0.12 : 0) +
          (lowerSentence.includes("it is important to note") ? 0.1 : 0)
      );

      return {
        explanation:
          "Heuristic fallback based on sentence consistency, lexical diversity, and repeated generic phrasing.",
        label: sentenceScore >= 0.65 ? "likely_ai" : "likely_human",
        probability: sentenceScore,
        sentenceEndChar: sentence.endChar,
        sentenceStartChar: sentence.startChar
      };
    }),
    confidenceBand: score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low",
    notes,
    probability: score
  };
}

async function scanAcademicMetadata(
  input: ScanProviderInput,
  chunks: TextChunk[],
  config: DemoRealScanProviderConfig
): Promise<AcademicScanResult> {
  if (
    input.scanMode === "fallback" ||
    config.demoAcademicProvider !== "openalex" ||
    chunks.length === 0
  ) {
    return {
      matches: [],
      status: {
        fallback: true,
        provider: "openalex",
        reason: "OpenAlex provider setting is missing"
      }
    };
  }

  const reservation = await reserveProviderFeatureUsage(
    input,
    config,
    "ACADEMIC_SOURCE_LOOKUP"
  );

  if (!reservation.allowed) {
    return {
      matches: [],
      status: {
        fallback: true,
        provider: "openalex",
        reason: reservation.reason
      }
    };
  }

  try {
    const seen = new Set<string>();
    const matches: AcademicMetadataMatch[] = [];

    for (const chunk of chunks.slice(0, 3)) {
      const url = new URL("https://api.openalex.org/works");
      url.searchParams.set("search", chunk.text.slice(0, 220));
      url.searchParams.set("per-page", String(config.openAlexMaxResults));
      url.searchParams.set(
        "select",
        [
          "id",
          "doi",
          "title",
          "display_name",
          "publication_year",
          "authorships",
          "primary_location",
          "abstract_inverted_index"
        ].join(",")
      );

      if (config.openAlexMailto) {
        url.searchParams.set("mailto", config.openAlexMailto);
      }

      if (config.openAlexApiKey) {
        url.searchParams.set("api_key", config.openAlexApiKey);
      }

      const response = await fetchJson(url.toString(), {
        method: "GET"
      });
      const parsed = openAlexResponseSchema.parse(response);

      for (const work of parsed.results) {
        const title = work.title ?? work.display_name ?? "Untitled OpenAlex work";
        const key = `${work.id ?? ""}:${title}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        matches.push({
          abstractSnippet: buildOpenAlexAbstractSnippet(
            work.abstract_inverted_index
          ),
          authors: work.authorships
            .map((authorship) => authorship.author?.display_name)
            .filter((name): name is string => Boolean(name)),
          doi: work.doi ?? null,
          openAlexUrl: work.id ?? null,
          publicationYear: work.publication_year ?? null,
          source: work.primary_location?.source?.display_name ?? null,
          title
        });
      }
    }

    await consumeFeatureUsage({
      metadata: {
        resultCount: matches.length
      },
      reservationId: reservation.reservationId
    });

    return {
      matches: matches.slice(0, config.openAlexMaxResults),
      status: {
        fallback: false,
        provider: "openalex",
        resultCount: matches.length
      }
    };
  } catch (error) {
    await consumeFeatureUsage({
      metadata: {
        fallbackReason: getSafeErrorReason(error)
      },
      reservationId: reservation.reservationId
    });
    return {
      matches: [],
      status: {
        fallback: true,
        provider: "openalex",
        reason: getSafeErrorReason(error)
      }
    };
  }
}

async function scanGrammar(
  input: ScanProviderInput,
  config: DemoRealScanProviderConfig
): Promise<GrammarScanResult> {
  const text = input.text;

  if (
    input.scanMode === "fallback" ||
    config.demoGrammarProvider !== "languagetool-public"
  ) {
    return {
      findings: fallbackGrammarScan(text),
      status: {
        fallback: true,
        provider: "languagetool-public",
        reason: "LanguageTool provider setting is missing"
      }
    };
  }

  const reservation = await reserveProviderFeatureUsage(
    input,
    config,
    "GRAMMAR_REVIEW"
  );

  if (!reservation.allowed) {
    return {
      findings: fallbackGrammarScan(text),
      status: {
        fallback: true,
        provider: "languagetool-public",
        reason: reservation.reason
      }
    };
  }

  try {
    const budgetConfig = config.featureBudgetConfig ?? readFeatureBudgetConfig();
    const grammarBudgetChars = getGrammarCharacterLimitForScanMode(
      input.scanMode,
      budgetConfig
    );
    const grammarText = text.slice(
      0,
      Math.min(grammarBudgetChars, config.languageToolMaxChars)
    );
    const body = new URLSearchParams({
      language: config.languageToolLanguage,
      text: grammarText
    });
    const response = await fetchJson(config.languageToolUrl, {
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });
    const parsed = languageToolResponseSchema.parse(response);

    await consumeFeatureUsage({
      metadata: {
        characterCount: grammarText.length,
        resultCount: parsed.matches.length
      },
      reservationId: reservation.reservationId
    });

    return {
      findings: parsed.matches.slice(0, 25).map((match) => ({
        length: match.length,
        message: buildGrammarMessage(match.message, match.rule?.id),
        offset: match.offset,
        replacementSuggestions: match.replacements
          .map((replacement) => replacement.value)
          .slice(0, 5)
      })),
      status: {
        fallback: false,
        provider: "languagetool-public",
        resultCount: parsed.matches.length
      }
    };
  } catch (error) {
    await consumeFeatureUsage({
      metadata: {
        fallbackReason: getSafeErrorReason(error)
      },
      reservationId: reservation.reservationId
    });
    return {
      findings: fallbackGrammarScan(text),
      status: {
        fallback: true,
        provider: "languagetool-public",
        reason: getSafeErrorReason(error)
      }
    };
  }
}

function fallbackGrammarScan(text: string): ScanGrammarFinding[] {
  const findings: ScanGrammarFinding[] = [];

  for (const typo of commonMisspellings) {
    for (const match of text.matchAll(typo.pattern)) {
      findings.push({
        length: match[0].length,
        message: typo.message,
        offset: match.index ?? 0,
        replacementSuggestions: [...typo.replacementSuggestions]
      });
    }
  }

  for (const match of text.matchAll(/\b(\w+)\s+\1\b/gi)) {
    findings.push({
      length: match[0].length,
      message: "Repeated word",
      offset: match.index ?? 0,
      replacementSuggestions: [match[1] ?? ""].filter(Boolean)
    });
  }

  for (const match of text.matchAll(/ {2,}/g)) {
    findings.push({
      length: match[0].length,
      message: "Repeated whitespace",
      offset: match.index ?? 0,
      replacementSuggestions: [" "]
    });
  }

  for (const sentence of splitSentences(text)) {
    if (countWords(sentence.text) > 45) {
      findings.push({
        length: sentence.text.length,
        message: "Very long sentence",
        offset: sentence.startChar,
        replacementSuggestions: []
      });
    }
  }

  return findings.sort((left, right) => left.offset - right.offset).slice(0, 25);
}

function buildTextChunks(text: string, maxChunks: number): TextChunk[] {
  const sentences = splitSentences(text);
  const chunks: TextChunk[] = [];
  let current: TextChunk | null = null;

  for (const sentence of sentences) {
    if (!current) {
      current = {
        endChar: sentence.endChar,
        index: chunks.length,
        startChar: sentence.startChar,
        text: sentence.text
      };
      continue;
    }

    if (countWords(`${current.text} ${sentence.text}`) <= 70) {
      current = {
        ...current,
        endChar: sentence.endChar,
        text: `${current.text} ${sentence.text}`
      };
    } else {
      chunks.push(current);
      current = {
        endChar: sentence.endChar,
        index: chunks.length,
        startChar: sentence.startChar,
        text: sentence.text
      };
    }

    if (chunks.length >= maxChunks) {
      break;
    }
  }

  if (current && chunks.length < maxChunks) {
    chunks.push(current);
  }

  if (chunks.length === 0 && text.trim()) {
    const trimmedStart = text.search(/\S/);
    const startChar = Math.max(0, trimmedStart);
    chunks.push({
      endChar: Math.min(text.length, startChar + 500),
      index: 0,
      startChar,
      text: text.trim().slice(0, 500)
    });
  }

  return chunks
    .filter((chunk) => countWords(chunk.text) >= 4)
    .slice(0, maxChunks);
}

function splitSentences(text: string): Array<{
  endChar: number;
  startChar: number;
  text: string;
}> {
  const sentences: Array<{
    endChar: number;
    startChar: number;
    text: string;
  }> = [];

  for (const match of text.matchAll(/[^.!?]+[.!?]*/g)) {
    const sentence = match[0].trim();

    if (!sentence) {
      continue;
    }

    const leadingWhitespace = match[0].search(/\S/);
    const startChar = (match.index ?? 0) + Math.max(0, leadingWhitespace);
    sentences.push({
      endChar: startChar + sentence.length,
      startChar,
      text: sentence
    });
  }

  return sentences;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function calculateSimilarityScore(
  matches: ScanSourceMatch[],
  academicMatchCount: number
): number {
  if (matches.length === 0) {
    return academicMatchCount > 0 ? clampScore(academicMatchCount * 5) : 0;
  }

  const topScores = matches
    .map((match) => match.similarityScore)
    .sort((left, right) => right - left)
    .slice(0, 5);
  const average =
    topScores.reduce((sum, score) => sum + score, 0) / topScores.length;
  const coverageBoost = Math.min(20, matches.length * 3);
  const academicBoost = Math.min(10, academicMatchCount * 2);

  return clampScore(average * 0.75 + coverageBoost + academicBoost);
}

function buildGeminiPrompt(text: string): string {
  return [
    "Return strict JSON only. Do not include markdown.",
    "Assess whether the writing appears AI-generated, but do not frame the result as proof of misconduct.",
    "Use this JSON shape:",
    '{"aiProbability":0.0,"confidenceBand":"low","writingPatternNotes":["string"],"sentenceAssessments":[{"text":"string","probability":0.0,"reason":"string"}]}',
    "Use probabilities from 0 to 1.",
    "Submitted text:",
    text.slice(0, 12_000)
  ].join("\n");
}

function extractGeminiText(response: unknown): string {
  const schema = z.object({
    candidates: z
      .array(
        z.object({
          content: z.object({
            parts: z.array(
              z.object({
                text: z.string().optional()
              })
            )
          })
        })
      )
      .min(1)
  });
  const parsed = schema.parse(response);
  const text = parsed.candidates[0]?.content.parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not include text");
  }

  return text;
}

function findSentenceRange(
  fullText: string,
  sentenceText: string
): { endChar: number; startChar: number; text: string } | null {
  const normalizedNeedle = sentenceText.trim();
  const startChar = fullText.indexOf(normalizedNeedle);

  if (startChar === -1) {
    return null;
  }

  return {
    endChar: startChar + normalizedNeedle.length,
    startChar,
    text: normalizedNeedle
  };
}

function buildOpenAlexAbstractSnippet(
  invertedIndex: Record<string, number[]> | null | undefined
): string | null {
  if (!invertedIndex) {
    return null;
  }

  const positions: Array<{
    position: number;
    word: string;
  }> = [];

  for (const [word, wordPositions] of Object.entries(invertedIndex)) {
    for (const position of wordPositions) {
      positions.push({
        position,
        word
      });
    }
  }

  return positions
    .sort((left, right) => left.position - right.position)
    .slice(0, 70)
    .map((position) => position.word)
    .join(" ")
    .slice(0, 500);
}

function buildGrammarMessage(message: string, ruleId: string | undefined): string {
  return ruleId ? `${message} (${ruleId})` : message;
}

async function reserveProviderFeatureUsage(
  input: ScanProviderInput,
  config: DemoRealScanProviderConfig,
  featureKey: FeatureKey
): Promise<
  | {
      allowed: true;
      reservationId: string | null;
    }
  | {
      allowed: false;
      reason: string;
    }
> {
  if (!config.budgetEnforcement) {
    return {
      allowed: true,
      reservationId: null
    };
  }

  const budgetConfig = config.featureBudgetConfig ?? readFeatureBudgetConfig();
  const estimate = estimateScanUsage(
    {
      charCount: input.text.length,
      scanMode: input.scanMode,
      wordCount: input.scannedWordCount
    },
    budgetConfig
  );
  const item = estimate.items.find((entry) => entry.featureKey === featureKey);

  if (!item) {
    return {
      allowed: true,
      reservationId: null
    };
  }

  const reservation = await reserveFeatureUsage({
    featureKey,
    metadata: {
      scanMode: input.scanMode,
      submissionId: input.submissionId
    },
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    units: item.units
  });

  if (reservation.allowed) {
    return {
      allowed: true,
      reservationId: reservation.reservationId
    };
  }

  await recordFallbackUsage({
    featureKey,
    metadata: {
      reason: reservation.message,
      scanMode: input.scanMode
    },
    submissionId: input.submissionId,
    tenantId: input.tenantId,
    units: 0
  });

  return {
    allowed: false,
    reason: reservation.message
  };
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = 10_000
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Provider request failed with status ${response.status}`);
    }

    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeProbability(value: number): number {
  const normalized = value > 1 ? value / 100 : value;

  return clampProbability(normalized);
}

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function normalizeOptionalSecret(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const lowerValue = value.toLowerCase();

  if (
    lowerValue.includes("paste_your") ||
    lowerValue.includes("replace-with") ||
    lowerValue === "optional"
  ) {
    return undefined;
  }

  return value;
}

function getSafeErrorReason(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "AbortError" ? "Provider request timed out" : error.message;
  }

  return "Provider request failed";
}
