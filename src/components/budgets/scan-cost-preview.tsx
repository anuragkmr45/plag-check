export type UiScanMode = "deep" | "fallback" | "standard";

type ScanCostPreviewProps = {
  charCount?: number;
  scanMode: UiScanMode;
  wordCount?: number;
};

export function ScanCostPreview({
  charCount = 0,
  scanMode,
  wordCount = 0
}: ScanCostPreviewProps): React.JSX.Element {
  const estimate = buildUiScanEstimate(scanMode, wordCount, charCount);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Scan-cost preview
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Estimated feature capacity used before this check is queued.
          </p>
        </div>
        <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
          {estimate.modeLabel}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {estimate.rows.map((row) => (
          <div key={row.label}>
            <dt className="font-medium text-slate-800">{row.label}</dt>
            <dd className="mt-1 text-slate-600">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function buildUiScanEstimate(
  scanMode: UiScanMode,
  wordCount: number,
  charCount: number
): {
  modeLabel: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
} {
  const safeWordCount = Math.max(0, Math.ceil(wordCount));
  const safeCharCount = Math.max(0, Math.ceil(charCount));

  if (scanMode === "fallback") {
    return {
      modeLabel: "Local Fallback Check",
      rows: [
        { label: "Fallback Scans", value: "1 check" },
        { label: "Monthly Words Processed", value: formatNumber(safeWordCount) }
      ]
    };
  }

  const isDeep = scanMode === "deep";
  const grammarLimit = isDeep ? 36_000 : 18_000;

  return {
    modeLabel: isDeep ? "Deep Check" : "Standard Check",
    rows: [
      { label: "Full Checks", value: isDeep ? "2 check units" : "1 check" },
      {
        label: "Web Source Matching",
        value: `${isDeep ? 6 : 3} units`
      },
      { label: "AI Writing Analysis", value: "1 request" },
      {
        label: "Academic Source Lookup",
        value: `${isDeep ? 3 : 2} units`
      },
      {
        label: "Grammar Review",
        value: `${formatNumber(Math.min(safeCharCount, grammarLimit))} characters`
      },
      { label: "Monthly Words Processed", value: formatNumber(safeWordCount) }
    ]
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}
