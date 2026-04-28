import { describe, expect, it } from "vitest";
import { createDemoRealScanProvider } from "../src/features/scanning/providers";

const scanInput = {
  originalWordCount: 45,
  scanMode: "standard",
  scannedWordCount: 42,
  submissionId: "00000000-0000-4000-8000-000000000401",
  tenantId: "00000000-0000-4000-8000-000000000402",
  text: [
    "Academic integrity depends on transparent attribution.",
    "Plagiarism detection compares submitted writing with source material.",
    "In conclusion, it is important to note that the student will recieve feedback after teh draft."
  ].join(" ")
} as const;

const fallbackConfig = {
  allowFallback: true,
  demoAcademicProvider: "fallback",
  demoAiDetectionMode: "heuristic",
  demoAiProvider: "heuristic",
  demoGrammarProvider: "fallback",
  demoWebSearchProvider: "fallback",
  geminiMaxOutputTokens: 1200,
  geminiModel: "gemini-2.0-flash",
  languageToolLanguage: "en-US",
  languageToolMaxChars: 20000,
  languageToolUrl: "https://api.languagetool.org/v2/check",
  openAlexMaxResults: 5,
  tavilyMaxChunks: 4,
  tavilyMaxResults: 5,
  tavilySearchDepth: "basic"
} as const;

describe("demo-real scan provider", () => {
  it("produces a report-ready fallback result without API keys", async () => {
    const provider = createDemoRealScanProvider(fallbackConfig);
    const result = await provider.scan(scanInput);

    expect(result.similarityScore).toBeGreaterThan(0);
    expect(result.sourceMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceTitle: expect.stringContaining("Academic Integrity")
        })
      ])
    );
    expect(result.aiProbability).toBeGreaterThanOrEqual(0);
    expect(result.aiProbability).toBeLessThanOrEqual(1);
    expect(result.grammarFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Possible typo: recieve"
        }),
        expect.objectContaining({
          message: "Possible typo: teh"
        })
      ])
    );
    expect(result.providerMetadata).toMatchObject({
      fallback: true,
      provider: "demo-real",
      subproviders: {
        ai: {
          fallback: true,
          provider: "gemini"
        },
        grammar: {
          fallback: true,
          provider: "languagetool-public"
        },
        web: {
          fallback: true,
          provider: "tavily"
        }
      }
    });
  });

  it("keeps Tavily query strings under the provider limit", async () => {
    const calls: unknown[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      calls.push(JSON.parse(String(init?.body)));

      return new Response(
        JSON.stringify({
          results: [
            {
              content: "Matched web snippet",
              score: 0.7,
              title: "Matched web source",
              url: "https://example.test/source"
            }
          ]
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      );
    }) as typeof fetch;

    try {
      const provider = createDemoRealScanProvider({
        ...fallbackConfig,
        demoWebSearchProvider: "tavily",
        tavilyApiKey: "test-key"
      });
      const result = await provider.scan({
        ...scanInput,
        scanMode: "standard",
        text: `${"Long copied sentence with academic integrity wording ".repeat(30)}.`
      });

      expect(result.providerMetadata).toMatchObject({
        fallback: true,
        subproviders: {
          web: {
            fallback: false,
            provider: "tavily"
          }
        }
      });
      expect(
        calls.every((body) => {
          if (!body || typeof body !== "object" || !("query" in body)) {
            return false;
          }

          return String(body.query).length <= 400;
        })
      ).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
