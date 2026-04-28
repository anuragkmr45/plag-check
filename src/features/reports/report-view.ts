export type DisplayMetadataEntry = {
  label: string;
  value: string;
};

export type ReportVisualSourceInput = {
  similarityScore: number;
  sourceTitle: string;
};

export type ReportVisualSummaryInput = {
  aiProbability: number;
  grammarFindingCount: number;
  originalWordCount: number;
  removedWordCount?: number | null;
  scannedWordCount: number;
  similarityScore: number;
  sourceMatches: ReportVisualSourceInput[];
};

export type ReportVisualBand = {
  description: string;
  label: string;
  tone: "low" | "moderate" | "high";
};

export type ReportVisualSummary = {
  ai: {
    aiPercent: number;
    band: ReportVisualBand;
    humanPercent: number;
  };
  grammar: {
    densityLabel: string;
    findingCount: number;
  };
  preprocessing: {
    excludedPercent: number;
    excludedWords: number;
    scannedPercent: number;
    scannedWords: number;
    totalWords: number;
  };
  similarity: {
    band: ReportVisualBand;
    copiedPercent: number;
    originalPercent: number;
  };
  topSources: Array<{
    label: string;
    rank: number;
    score: number;
  }>;
};

export function formatReportScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function formatReportProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

export function formatVisualPercent(percent: number): string {
  return `${Math.round(clampPercent(percent))}%`;
}

export function buildReportVisualSummary(
  input: ReportVisualSummaryInput
): ReportVisualSummary {
  const copiedPercent = clampPercent(input.similarityScore);
  const aiPercent = clampPercent(input.aiProbability * 100);
  const originalWords = sanitizeCount(input.originalWordCount);
  const scannedWords = sanitizeCount(input.scannedWordCount);
  const explicitRemovedWords =
    typeof input.removedWordCount === "number"
      ? sanitizeCount(input.removedWordCount)
      : null;
  const inferredRemovedWords = Math.max(0, originalWords - scannedWords);
  const excludedWords = explicitRemovedWords ?? inferredRemovedWords;
  const totalWords = Math.max(
    0,
    originalWords,
    scannedWords + excludedWords
  );
  const scannedPercent =
    totalWords > 0 ? clampPercent((scannedWords / totalWords) * 100) : 0;
  const grammarDensity =
    scannedWords > 0 ? (input.grammarFindingCount / scannedWords) * 1000 : 0;

  return {
    ai: {
      aiPercent,
      band: getIndicatorBand(aiPercent, {
        high: "High AI-writing indicator",
        low: "Low AI-writing indicator",
        moderate: "Moderate AI-writing indicator"
      }),
      humanPercent: clampPercent(100 - aiPercent)
    },
    grammar: {
      densityLabel:
        scannedWords > 0
          ? `${input.grammarFindingCount} findings - ${Math.round(
              grammarDensity
            )} per 1,000 scanned words`
          : `${input.grammarFindingCount} findings`,
      findingCount: input.grammarFindingCount
    },
    preprocessing: {
      excludedPercent: clampPercent(100 - scannedPercent),
      excludedWords,
      scannedPercent,
      scannedWords,
      totalWords
    },
    similarity: {
      band: getIndicatorBand(copiedPercent, {
        high: "High similarity indicator",
        low: "Low similarity indicator",
        moderate: "Moderate similarity indicator"
      }),
      copiedPercent,
      originalPercent: clampPercent(100 - copiedPercent)
    },
    topSources: input.sourceMatches
      .map((source) => ({
        label: source.sourceTitle.trim() || "Untitled source",
        score: clampPercent(source.similarityScore)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((source, index) => ({
        ...source,
        rank: index + 1
      }))
  };
}

export function formatCharacterRange(startChar: number, endChar: number): string {
  return `${startChar}-${endChar}`;
}

export function formatAssessmentLabel(label: string): string {
  return label
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const normalized = word.toLowerCase();

      if (normalized === "ai") {
        return "AI";
      }

      return index === 0
        ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
        : normalized;
    })
    .join(" ");
}

export function formatExclusionRules(rulesApplied: unknown): string[] {
  if (!isRecord(rulesApplied)) {
    return ["No exclusion rules were recorded."];
  }

  const rules: string[] = [];

  if (rulesApplied.normalizeWhitespace === true) {
    rules.push("Whitespace normalized");
  }

  if (typeof rulesApplied.removeBibliography === "boolean") {
    rules.push(
      rulesApplied.removeBibliography
        ? "Bibliography and references excluded"
        : "Bibliography and references included"
    );
  }

  if (typeof rulesApplied.removeQuotes === "boolean") {
    rules.push(
      rulesApplied.removeQuotes ? "Quoted text excluded" : "Quoted text included"
    );
  }

  if (typeof rulesApplied.smallMatchWordThreshold === "number") {
    rules.push(
      `Small matches under ${rulesApplied.smallMatchWordThreshold} words excluded`
    );
  } else if (rulesApplied.smallMatchWordThreshold === null) {
    rules.push("Small-match threshold disabled");
  }

  return rules.length > 0 ? rules : ["No exclusion rules were recorded."];
}

export function formatMetadataEntries(metadata: unknown): DisplayMetadataEntry[] {
  if (!isRecord(metadata)) {
    return [];
  }

  return Object.entries(metadata)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => ({
      label: humanizeMetadataKey(key),
      value: stringifyMetadataValue(value)
    }));
}

export function formatReplacementSuggestions(suggestions: unknown): string {
  if (!Array.isArray(suggestions)) {
    return "No replacement suggestions";
  }

  const safeSuggestions = suggestions
    .filter((suggestion): suggestion is string => typeof suggestion === "string")
    .map((suggestion) => suggestion.trim())
    .filter(Boolean);

  return safeSuggestions.length > 0
    ? safeSuggestions.join(", ")
    : "No replacement suggestions";
}

function humanizeMetadataKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

function stringifyMetadataValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function getIndicatorBand(
  percent: number,
  labels: {
    high: string;
    low: string;
    moderate: string;
  }
): ReportVisualBand {
  if (percent >= 70) {
    return {
      description: "Reviewer attention recommended before a decision is made.",
      label: labels.high,
      tone: "high"
    };
  }

  if (percent >= 35) {
    return {
      description: "Review the supporting evidence before interpreting this score.",
      label: labels.moderate,
      tone: "moderate"
    };
  }

  return {
    description: "No immediate conclusion should be made without source review.",
    label: labels.low,
    tone: "low"
  };
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
}

function sanitizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
