import type {
  ScanAiAssessment,
  ScanGrammarFinding,
  ScanProvider,
  ScanProviderInput,
  ScanProviderResult,
  ScanSourceMatch
} from "./types";

const sampleSources = [
  {
    phrase: "academic integrity",
    sourceTitle: "Academic Integrity Guide",
    sourceUrl: "https://example.invalid/sources/academic-integrity"
  },
  {
    phrase: "machine learning",
    sourceTitle: "Machine Learning Overview",
    sourceUrl: "https://example.invalid/sources/machine-learning"
  },
  {
    phrase: "plagiarism detection",
    sourceTitle: "Similarity Detection Notes",
    sourceUrl: "https://example.invalid/sources/plagiarism-detection"
  },
  {
    phrase: "artificial intelligence",
    sourceTitle: "Artificial Intelligence Primer",
    sourceUrl: "https://example.invalid/sources/artificial-intelligence"
  }
] as const;

const aiIndicatorPhrases = [
  "as an ai",
  "language model",
  "in conclusion",
  "it is important to note"
] as const;

export const mockScanProvider: ScanProvider = {
  id: "mock",
  async scan(input: ScanProviderInput): Promise<ScanProviderResult> {
    const sourceMatches = findSourceMatches(input.text);
    const aiAssessments = buildAiAssessments(input.text);
    const grammarFindings = findGrammarFindings(input.text);
    const similarityScore = scoreSimilarity(input.text, sourceMatches.length);
    const aiProbability = scoreAiProbability(input.text, aiAssessments);

    return {
      aiAssessments,
      aiProbability,
      grammarFindings,
      providerMetadata: {
        algorithmVersion: "mock-v1",
        matchedPhraseCount: sourceMatches.length,
        provider: "mock",
        textLength: input.text.length
      },
      similarityScore,
      sourceMatches
    };
  }
};

function findSourceMatches(text: string): ScanSourceMatch[] {
  const matches: ScanSourceMatch[] = [];
  const lowerText = text.toLowerCase();

  for (const source of sampleSources) {
    let searchStart = 0;

    while (searchStart < lowerText.length) {
      const index = lowerText.indexOf(source.phrase, searchStart);

      if (index === -1) {
        break;
      }

      matches.push({
        endChar: index + source.phrase.length,
        matchedText: text.slice(index, index + source.phrase.length),
        similarityScore: clampScore(72 + (source.phrase.length % 19)),
        sourceTitle: source.sourceTitle,
        sourceUrl: source.sourceUrl,
        startChar: index
      });
      searchStart = index + source.phrase.length;
    }
  }

  return matches.sort((left, right) => left.startChar - right.startChar);
}

function buildAiAssessments(text: string): ScanAiAssessment[] {
  return splitSentences(text)
    .map((sentence) => {
      const lowerSentence = sentence.text.toLowerCase();
      const indicatorCount = aiIndicatorPhrases.filter((phrase) =>
        lowerSentence.includes(phrase)
      ).length;
      const probability = clampProbability(
        0.12 + indicatorCount * 0.28 + (sentence.text.length % 17) / 100
      );

      return {
        explanation:
          indicatorCount > 0
            ? "Mock AI indicators matched deterministic sample phrases."
            : null,
        label: probability >= 0.5 ? "likely_ai" : "likely_human",
        probability,
        sentenceEndChar: sentence.endChar,
        sentenceStartChar: sentence.startChar
      };
    })
    .slice(0, 5);
}

function findGrammarFindings(text: string): ScanGrammarFinding[] {
  const findings: ScanGrammarFinding[] = [];
  const typoPatterns = [
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
      message: "Repeated whitespace",
      pattern: / {2,}/g,
      replacementSuggestions: [" "]
    }
  ] as const;

  for (const typo of typoPatterns) {
    for (const match of text.matchAll(typo.pattern)) {
      const offset = match.index ?? 0;

      findings.push({
        length: match[0].length,
        message: typo.message,
        offset,
        replacementSuggestions: [...typo.replacementSuggestions]
      });
    }
  }

  return findings.sort((left, right) => left.offset - right.offset);
}

function scoreSimilarity(text: string, matchCount: number): number {
  return clampScore(matchCount * 18 + (text.length % 29));
}

function scoreAiProbability(
  text: string,
  assessments: ScanAiAssessment[]
): number {
  const strongestSentence = Math.max(
    0,
    ...assessments.map((assessment) => assessment.probability)
  );
  const lengthComponent = Math.min(0.2, text.length / 5000);

  return clampProbability(strongestSentence + lengthComponent);
}

function splitSentences(text: string): {
  endChar: number;
  startChar: number;
  text: string;
}[] {
  const sentences: {
    endChar: number;
    startChar: number;
    text: string;
  }[] = [];
  const pattern = /[^.!?]+[.!?]*/g;

  for (const match of text.matchAll(pattern)) {
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

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}
