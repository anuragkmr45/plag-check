import Link from "next/link";
import type { SubmissionScanSummary } from "../../server/services/scanning.service";
import type { SubmissionStatus } from "../../server/services/submissions.service";
import { ScanSubmissionButton } from "./scan-submission-button";
import { SubmissionStatusAutoRefresh } from "./submission-status-auto-refresh";

type ScanStatusPanelProps = {
  charCount?: number;
  hasPreprocessing: boolean;
  statusUpdatedAt: Date;
  scanSummary: SubmissionScanSummary | null;
  status: SubmissionStatus;
  submissionId: string;
  wordCount?: number;
};

type TimelineStep = {
  label: string;
  state: "complete" | "current" | "failed" | "pending";
  status: Extract<
    SubmissionStatus,
    "READY_FOR_SCAN" | "SCAN_QUEUED" | "SCANNING" | "SCAN_COMPLETE"
  >;
};

const lifecycleSteps = [
  {
    label: "Ready",
    status: "READY_FOR_SCAN"
  },
  {
    label: "Queued",
    status: "SCAN_QUEUED"
  },
  {
    label: "Scanning",
    status: "SCANNING"
  },
  {
    label: "Complete",
    status: "SCAN_COMPLETE"
  }
] as const;

export function ScanStatusPanel({
  charCount = 0,
  hasPreprocessing,
  statusUpdatedAt,
  scanSummary,
  status,
  submissionId,
  wordCount = 0
}: ScanStatusPanelProps): React.JSX.Element {
  const latestResult = status === "SCAN_COMPLETE" ? scanSummary?.latestResult : null;
  const statusHelp = getScanStatusHelp(status);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <SubmissionStatusAutoRefresh
        initialStatus={status}
        initialUpdatedAt={statusUpdatedAt.toISOString()}
        submissionId={submissionId}
      />
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Scan lifecycle
        </h2>
      </div>
      <div className="space-y-5 p-5">
        <ol className="grid gap-3 sm:grid-cols-4">
          {buildScanTimeline(status).map((step) => (
            <li
              className="flex min-h-16 items-start gap-3 rounded-md border border-slate-200 px-3 py-3"
              key={step.status}
            >
              <span
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                  step.state === "failed"
                    ? "bg-red-500"
                    : step.state === "complete"
                      ? "bg-emerald-600"
                      : step.state === "current"
                        ? "bg-slate-950"
                        : "bg-slate-300"
                }`}
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  {step.label}
                </span>
                <span className="mt-1 block text-xs capitalize text-slate-500">
                  {step.state}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-900">
            {getScanStatusLabel(status)}
          </p>
          {statusHelp ? (
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {statusHelp}
            </p>
          ) : null}
          {scanSummary?.latestJob ? (
            <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
              <div>
                <dt className="font-medium text-slate-800">Job status</dt>
                <dd>{scanSummary.latestJob.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Scan mode</dt>
                <dd className="capitalize">{scanSummary.latestJob.scanMode}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Attempts</dt>
                <dd>{scanSummary.latestJob.attempts}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Provider</dt>
                <dd>{scanSummary.latestJob.provider}</dd>
              </div>
            </dl>
          ) : null}
          {scanSummary?.latestJob?.errorMessage ? (
            <p
              className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              role="alert"
            >
              {scanSummary.latestJob.errorMessage}
            </p>
          ) : null}
        </div>

        {shouldShowScanAction(status, hasPreprocessing) ? (
          <ScanSubmissionButton
            charCount={charCount}
            submissionId={submissionId}
            wordCount={wordCount}
          />
        ) : null}

        {latestResult ? (
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="font-medium text-slate-800">Similarity</dt>
                <dd className="text-slate-600">
                  {formatScoreAsPercent(latestResult.similarityScore)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">AI probability</dt>
                <dd className="text-slate-600">
                  {formatProbabilityAsPercent(latestResult.aiProbability)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Source matches</dt>
                <dd className="text-slate-600">
                  {latestResult.sourceMatchCount}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Grammar findings</dt>
                <dd className="text-slate-600">
                  {latestResult.grammarFindingCount}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">
              Scanned {latestResult.scannedWordCount} of{" "}
              {latestResult.originalWordCount} extracted words.
            </p>
            <Link
              className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/submissions/${submissionId}/report`}
            >
              Open report
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function shouldShowScanAction(
  status: SubmissionStatus,
  hasPreprocessing: boolean
): boolean {
  return status === "READY_FOR_SCAN" && hasPreprocessing;
}

export function buildScanTimeline(status: SubmissionStatus): TimelineStep[] {
  const currentIndex = lifecycleSteps.findIndex((step) => step.status === status);

  return lifecycleSteps.map((step, index) => {
    if (status === "FAILED" && step.status === "SCANNING") {
      return {
        ...step,
        state: "failed"
      };
    }

    if (status === "SCAN_COMPLETE" || (currentIndex >= 0 && index < currentIndex)) {
      return {
        ...step,
        state: "complete"
      };
    }

    if (currentIndex === index) {
      return {
        ...step,
        state: "current"
      };
    }

    return {
      ...step,
      state: "pending"
    };
  });
}

export function getScanStatusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "READY_FOR_SCAN":
      return "Ready to scan";
    case "SCAN_QUEUED":
      return "Scan queued";
    case "SCANNING":
      return "Scan running";
    case "SCAN_COMPLETE":
      return "Scan complete";
    case "FAILED":
      return "Scan failed";
    default:
      return "Scan not ready";
  }
}

export function getScanStatusHelp(status: SubmissionStatus): string | null {
  switch (status) {
    case "SCAN_QUEUED":
      return "This page updates automatically while the scan waits in the queue. In local demo mode, keep npm run worker running in a separate terminal.";
    case "SCANNING":
      return "This page updates automatically while analysis is running. In local demo mode, keep npm run worker running in a separate terminal.";
    case "FAILED":
      return "The latest scan stopped with an error. Check the job details below before retrying.";
    default:
      return null;
  }
}

export function formatScoreAsPercent(score: number): string {
  return `${Math.round(score)}%`;
}

export function formatProbabilityAsPercent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}
