"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ScanCostPreview,
  type UiScanMode
} from "../budgets/scan-cost-preview";

type ScanSubmissionButtonProps = {
  charCount?: number;
  submissionId: string;
  wordCount?: number;
};

export function ScanSubmissionButton({
  charCount = 0,
  wordCount = 0,
  submissionId
}: ScanSubmissionButtonProps): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanMode, setScanMode] = useState<UiScanMode>("standard");

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/scan`, {
        body: JSON.stringify({
          scanMode
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "Could not start the scan.");
        return;
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">Scan mode</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["standard", "Standard Check"],
            ["deep", "Deep Check"],
            ["fallback", "Local Fallback Check"]
          ].map(([mode, label]) => (
            <label
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              key={mode}
            >
              <input
                checked={scanMode === mode}
                className="h-4 w-4 border-slate-300"
                name="scanMode"
                onChange={() => setScanMode(mode as UiScanMode)}
                type="radio"
                value={mode}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <ScanCostPreview
        charCount={charCount}
        scanMode={scanMode}
        wordCount={wordCount}
      />
      <button
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        onClick={handleClick}
        type="button"
      >
        {isSubmitting ? "Starting scan" : "Start scan"}
      </button>
      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
