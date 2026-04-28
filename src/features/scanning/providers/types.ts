export type ScanProviderInput = {
  originalWordCount: number;
  scannedWordCount: number;
  submissionId: string;
  tenantId: string;
  text: string;
};

export type ScanSourceMatch = {
  endChar: number;
  matchedText: string;
  similarityScore: number;
  sourceTitle: string;
  sourceUrl: string | null;
  startChar: number;
};

export type ScanAiAssessment = {
  explanation: string | null;
  label: string;
  probability: number;
  sentenceEndChar: number;
  sentenceStartChar: number;
};

export type ScanGrammarFinding = {
  length: number;
  message: string;
  offset: number;
  replacementSuggestions: string[];
};

export type ScanProviderResult = {
  aiAssessments: ScanAiAssessment[];
  aiProbability: number;
  grammarFindings: ScanGrammarFinding[];
  providerMetadata: Record<string, unknown>;
  similarityScore: number;
  sourceMatches: ScanSourceMatch[];
};

export type ScanProvider = {
  id: string;
  scan(input: ScanProviderInput): Promise<ScanProviderResult>;
};
