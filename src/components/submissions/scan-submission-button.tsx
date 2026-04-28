"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ScanSubmissionButtonProps = {
  submissionId: string;
};

export function ScanSubmissionButton({
  submissionId
}: ScanSubmissionButtonProps): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/scan`, {
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
    <div className="space-y-3">
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
