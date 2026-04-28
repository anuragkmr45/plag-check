import { and, eq, sql } from "drizzle-orm";
import { getDatabase, schema, type Database } from "../../lib/db";
import { env, type SeedEnv } from "../../lib/env";
import { seedDatabase, type SeedResult } from "./seed.service";

type DemoSeedOptions = {
  database?: Database;
};

type DemoSubmissionSeed = {
  aiProbability: number;
  aiReasons: string[];
  grammar: Array<{
    length: number;
    message: string;
    offset: number;
    replacementSuggestions: string[];
  }>;
  scenario: string;
  similarityScore: number;
  sourcePhrases: Array<{
    phrase: string;
    score: number;
    title: string;
    url: string;
  }>;
  status: (typeof schema.submissionStatus.enumValues)[number];
  title: string;
  text: string;
};

export type DemoSeedResult = SeedResult & {
  submissions: Array<{
    id: string;
    reportPath: string;
    title: string;
  }>;
};

const demoSeedMarker = "complete-demo";

const demoSubmissions = [
  {
    aiProbability: 0.38,
    aiReasons: [
      "Mixed sentence lengths and concrete references suggest a human-edited submission."
    ],
    grammar: [],
    scenario: "high_similarity",
    similarityScore: 78,
    sourcePhrases: [
      {
        phrase: "academic integrity depends on transparent attribution",
        score: 86,
        title: "Academic Integrity Policy Overview",
        url: "https://example.invalid/demo/integrity-policy"
      },
      {
        phrase: "plagiarism detection compares submitted writing with source material",
        score: 82,
        title: "Similarity Detection Methods",
        url: "https://example.invalid/demo/similarity-methods"
      }
    ],
    status: "UNDER_REVIEW",
    text: [
      "Academic integrity depends on transparent attribution and careful source use.",
      "Plagiarism detection compares submitted writing with source material to highlight passages that require reviewer attention.",
      "The reviewer must inspect each source match before any academic decision is made."
    ].join(" "),
    title: "Demo high similarity report"
  },
  {
    aiProbability: 0.86,
    aiReasons: [
      "The prose uses consistently balanced sentence lengths and generic transitions.",
      "Repeated polished phrasing raises the demo AI-likelihood indicator."
    ],
    grammar: [],
    scenario: "likely_ai",
    similarityScore: 18,
    sourcePhrases: [],
    status: "SCAN_COMPLETE",
    text: [
      "In conclusion, sustainable learning requires a comprehensive and balanced approach.",
      "Furthermore, it is important to note that every stakeholder must collaborate in a meaningful and strategic way.",
      "Moreover, the proposed framework demonstrates a consistent pathway for effective outcomes."
    ].join(" "),
    title: "Demo likely AI-written report"
  },
  {
    aiProbability: 0.22,
    aiReasons: [
      "The writing has varied structure and localized editing issues."
    ],
    grammar: [
      {
        length: 3,
        message: "Possible typo: teh",
        offset: 0,
        replacementSuggestions: ["the"]
      },
      {
        length: 7,
        message: "Possible typo: recieve",
        offset: 0,
        replacementSuggestions: ["receive"]
      },
      {
        length: 2,
        message: "Repeated whitespace",
        offset: 0,
        replacementSuggestions: [" "]
      }
    ],
    scenario: "grammar_issues",
    similarityScore: 9,
    sourcePhrases: [],
    status: "SCAN_COMPLETE",
    text: [
      "Teh student will recieve feedback after the draft review.",
      "This sentence has  repeated spacing and a very very long clause that should be shortened before final submission."
    ].join(" "),
    title: "Demo grammar findings report"
  }
] as const satisfies readonly DemoSubmissionSeed[];

export async function seedDemoData(
  seedEnv: SeedEnv,
  options: DemoSeedOptions = {}
): Promise<DemoSeedResult> {
  const db = options.database ?? getDatabase();
  const baseSeed = await seedDatabase(seedEnv, {
    database: db
  });
  const demoUser = baseSeed.users.find((user) => user.role === "USER");
  const reviewer = baseSeed.users.find((user) => user.role === "REVIEWER");

  if (!demoUser || !reviewer) {
    throw new Error("Demo seed users were not created");
  }

  const submissions = await db.transaction(async (tx) => {
    await tx
      .delete(schema.submissions)
      .where(
        and(
          eq(schema.submissions.tenantId, baseSeed.demoTenant.id),
          sql`${schema.submissions.metadata}->>'demoSeed' = ${demoSeedMarker}`
        )
      );

    const seededSubmissions: DemoSeedResult["submissions"] = [];

    for (const demo of demoSubmissions) {
      const wordCount = countWords(demo.text);
      const [submission] = await tx
        .insert(schema.submissions)
        .values({
          assignedReviewerId:
            demo.scenario === "high_similarity" ? reviewer.id : null,
          createdByUserId: demoUser.id,
          metadata: {
            demoScenario: demo.scenario,
            demoSeed: demoSeedMarker
          },
          status: demo.status,
          tenantId: baseSeed.demoTenant.id,
          title: demo.title,
          wordCount
        })
        .returning({
          id: schema.submissions.id,
          title: schema.submissions.title
        });
      const checksum = `demo-${demo.scenario}`;
      const [scanJob] = await tx
        .insert(schema.scanJobs)
        .values({
          attempts: 1,
          errorMessage: null,
          finishedAt: new Date(),
          provider: env.SCAN_PROVIDER === "demo-real" ? "demo-real" : "mock",
          startedAt: new Date(),
          status: "SUCCEEDED",
          submissionId: submission.id,
          tenantId: baseSeed.demoTenant.id
        })
        .returning({
          id: schema.scanJobs.id
        });

      await tx.insert(schema.submissionFiles).values({
        checksumSha256: checksum,
        fileSizeBytes: Buffer.byteLength(demo.text),
        mimeType: "text/plain",
        originalFilename: `${demo.scenario}.txt`,
        storageBucket: env.MINIO_BUCKET,
        storageKey: `demo-seed/${baseSeed.demoTenant.id}/${submission.id}.txt`,
        submissionId: submission.id,
        tenantId: baseSeed.demoTenant.id,
        uploadedByUserId: demoUser.id
      });

      await tx.insert(schema.extractedTexts).values({
        charCount: demo.text.length,
        extractionMethod: "demo-seed-text",
        rawText: demo.text,
        submissionId: submission.id,
        tenantId: baseSeed.demoTenant.id,
        wordCount
      });

      const chunks = buildTextChunks(demo.text);
      await tx.insert(schema.preprocessingRuns).values({
        originalWordCount: wordCount,
        removedWordCount: 0,
        rulesApplied: {
          normalizeWhitespace: true,
          removeBibliography: true,
          removeQuotes: true,
          smallMatchWordThreshold: 8
        },
        sanitizedText: demo.text,
        sanitizedWordCount: wordCount,
        submissionId: submission.id,
        tenantId: baseSeed.demoTenant.id
      });

      if (chunks.length > 0) {
        await tx.insert(schema.textChunks).values(
          chunks.map((chunk, index) => ({
            chunkIndex: index,
            endChar: chunk.endChar,
            startChar: chunk.startChar,
            submissionId: submission.id,
            tenantId: baseSeed.demoTenant.id,
            text: chunk.text,
            wordCount: countWords(chunk.text)
          }))
        );
      }

      const [scanResult] = await tx
        .insert(schema.scanResults)
        .values({
          aiProbability: demo.aiProbability,
          originalWordCount: wordCount,
          providerMetadata: buildDemoProviderMetadata(demo, wordCount),
          scannedWordCount: wordCount,
          scanJobId: scanJob.id,
          similarityScore: demo.similarityScore,
          submissionId: submission.id,
          tenantId: baseSeed.demoTenant.id
        })
        .returning({
          id: schema.scanResults.id
        });

      const sourceMatches = demo.sourcePhrases.map((source) => {
        const range = findRange(demo.text, source.phrase);

        return {
          endChar: range.endChar,
          matchedText: demo.text.slice(range.startChar, range.endChar),
          scanResultId: scanResult.id,
          similarityScore: source.score,
          sourceTitle: source.title,
          sourceUrl: source.url,
          startChar: range.startChar,
          tenantId: baseSeed.demoTenant.id
        };
      });

      if (sourceMatches.length > 0) {
        await tx.insert(schema.sourceMatches).values(sourceMatches);
      }

      const assessments = buildAiAssessments(demo.text, demo.aiProbability, demo.aiReasons);

      if (assessments.length > 0) {
        await tx.insert(schema.aiAssessments).values(
          assessments.map((assessment) => ({
            ...assessment,
            scanResultId: scanResult.id,
            tenantId: baseSeed.demoTenant.id
          }))
        );
      }

      const grammarFindings = resolveGrammarFindings(demo);

      if (grammarFindings.length > 0) {
        await tx.insert(schema.grammarFindings).values(
          grammarFindings.map((finding) => ({
            ...finding,
            scanResultId: scanResult.id,
            tenantId: baseSeed.demoTenant.id
          }))
        );
      }

      if (demo.scenario === "high_similarity") {
        const [reviewCase] = await tx
          .insert(schema.reviewCases)
          .values({
            assignedReviewerId: reviewer.id,
            finalDecision: null,
            status: "OPEN",
            submissionId: submission.id,
            tenantId: baseSeed.demoTenant.id
          })
          .returning({
            id: schema.reviewCases.id
          });

        await tx.insert(schema.reviewEvents).values([
          {
            actorUserId: null,
            comment: "Demo case opened for live reviewer queue.",
            eventType: "CASE_OPENED",
            metadata: {
              demoSeed: demoSeedMarker
            },
            reviewCaseId: reviewCase.id,
            tenantId: baseSeed.demoTenant.id
          },
          {
            actorUserId: reviewer.id,
            comment:
              "Review the highlighted web-source matches before making a decision.",
            eventType: "NOTE_ADDED",
            metadata: {},
            reviewCaseId: reviewCase.id,
            tenantId: baseSeed.demoTenant.id
          }
        ]);
      }

      await tx.insert(schema.auditEvents).values({
        action: "demo.seed.submission",
        actorUserId: null,
        entityId: submission.id,
        entityType: "submission",
        metadata: {
          demoScenario: demo.scenario
        },
        tenantId: baseSeed.demoTenant.id
      });

      seededSubmissions.push({
        id: submission.id,
        reportPath: `/submissions/${submission.id}/report`,
        title: submission.title
      });
    }

    return seededSubmissions;
  });

  return {
    ...baseSeed,
    submissions
  };
}

function buildDemoProviderMetadata(
  demo: DemoSubmissionSeed,
  wordCount: number
): Record<string, unknown> {
  const fallback = true;

  return {
    academicMatches:
      demo.scenario === "high_similarity"
        ? [
            {
              abstractSnippet:
                "Academic integrity policies describe attribution, source use, and reviewer judgment in institutional writing assessment.",
              authors: ["Demo Author"],
              doi: "https://doi.org/10.0000/demo-integrity",
              openAlexUrl: "https://openalex.org/W0000000000",
              publicationYear: 2026,
              source: "Demo Journal of Academic Practice",
              title: "Academic Integrity and Similarity Review"
            }
          ]
        : [],
    aiConfidenceBand:
      demo.aiProbability >= 0.75
        ? "high"
        : demo.aiProbability >= 0.45
          ? "medium"
          : "low",
    demoDisclaimer:
      "Demo Real uses Tavily, Gemini, OpenAlex, and LanguageTool/free APIs when configured. Results are for demonstration and review support only, not certified plagiarism proof.",
    fallback,
    generatedAt: new Date().toISOString(),
    originalWordCount: wordCount,
    provider: "demo-real",
    scannedWordCount: wordCount,
    subproviders: {
      academic: {
        fallback,
        provider: "openalex",
        reason: "Seeded demo metadata"
      },
      ai: {
        fallback,
        provider: "gemini",
        reason: "Seeded demo assessment"
      },
      grammar: {
        fallback,
        provider: "languagetool-public",
        reason: "Seeded demo findings"
      },
      web: {
        fallback,
        provider: "tavily",
        reason: "Seeded demo source matches"
      }
    },
    webMatches: demo.sourcePhrases.map((source, index) => ({
      chunkIndex: index,
      provider: "seeded-demo",
      snippet: source.phrase,
      sourceTitle: source.title,
      sourceUrl: source.url
    })),
    writingPatternNotes: demo.aiReasons
  };
}

function resolveGrammarFindings(
  demo: DemoSubmissionSeed
): DemoSubmissionSeed["grammar"] {
  return demo.grammar.map((finding) => {
    if (finding.message.includes("teh")) {
      const range = findRange(demo.text, "Teh");
      return {
        ...finding,
        offset: range.startChar
      };
    }

    if (finding.message.includes("recieve")) {
      const range = findRange(demo.text, "recieve");
      return {
        ...finding,
        offset: range.startChar
      };
    }

    if (finding.message.includes("Repeated whitespace")) {
      const range = findRange(demo.text, "  ");
      return {
        ...finding,
        offset: range.startChar
      };
    }

    return finding;
  });
}

function buildAiAssessments(
  text: string,
  probability: number,
  reasons: readonly string[]
): Array<{
  explanation: string;
  label: string;
  probability: number;
  sentenceEndChar: number;
  sentenceStartChar: number;
}> {
  return splitSentences(text).slice(0, 3).map((sentence, index) => ({
    explanation: reasons[index] ?? reasons[0] ?? "Seeded demo assessment.",
    label: probability >= 0.65 ? "likely_ai" : "likely_human",
    probability,
    sentenceEndChar: sentence.endChar,
    sentenceStartChar: sentence.startChar
  }));
}

function buildTextChunks(text: string): Array<{
  endChar: number;
  startChar: number;
  text: string;
}> {
  return splitSentences(text).map((sentence) => ({
    endChar: sentence.endChar,
    startChar: sentence.startChar,
    text: sentence.text
  }));
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

function findRange(
  text: string,
  phrase: string
): {
  endChar: number;
  startChar: number;
} {
  const startChar = text.toLowerCase().indexOf(phrase.toLowerCase());

  if (startChar === -1) {
    return {
      endChar: Math.min(text.length, phrase.length),
      startChar: 0
    };
  }

  return {
    endChar: startChar + phrase.length,
    startChar
  };
}
