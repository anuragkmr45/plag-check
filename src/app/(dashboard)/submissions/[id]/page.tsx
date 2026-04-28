import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PreprocessSubmissionButton } from "../../../../components/submissions/preprocess-submission-button";
import { ScanStatusPanel } from "../../../../components/submissions/scan-status-panel";
import { getRequiredSession } from "../../../../lib/auth/server";
import { getExtractionSummaryForSubmission } from "../../../../server/services/extraction.service";
import { getPreprocessingSummaryForSubmission } from "../../../../server/services/preprocessing.service";
import { getScanSummaryForSubmission } from "../../../../server/services/scanning.service";
import { getSubmissionDetailById } from "../../../../server/services/submissions.service";

const submissionIdSchema = z.string().uuid();

export default async function SubmissionDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}): Promise<React.JSX.Element> {
  const session = await getRequiredSession();
  const { id } = await params;
  const parsedId = submissionIdSchema.safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const detail = await getSubmissionDetailById(session.user, parsedId.data);

  if (!detail) {
    notFound();
  }

  const [extractionSummary, preprocessingSummary, scanSummary] = await Promise.all([
    getExtractionSummaryForSubmission(session.user, parsedId.data),
    getPreprocessingSummaryForSubmission(session.user, parsedId.data),
    getScanSummaryForSubmission(session.user, parsedId.data)
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
          href="/submissions"
        >
          Back to submissions
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              {detail.submission.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Created {formatDate(detail.submission.createdAt)}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
            {detail.submission.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Uploaded files
              </h2>
            </div>
            {detail.files.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {detail.files.map((file) => (
                  <li className="space-y-2 px-5 py-4" key={file.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">
                        {file.originalFilename}
                      </p>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {file.mimeType}
                      </span>
                    </div>
                    <dl className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-800">Size</dt>
                        <dd>{formatBytes(file.fileSizeBytes)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-800">Uploaded</dt>
                        <dd>{formatDate(file.createdAt)}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-slate-800">Checksum</dt>
                        <dd className="break-all font-mono text-xs">
                          {file.checksumSha256}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <p className="text-sm text-slate-600">
                  No files have been uploaded for this submission.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Text preparation
              </h2>
            </div>
            <div className="space-y-5 p-5">
              {extractionSummary ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-800">
                      Extracted words
                    </dt>
                    <dd className="text-slate-600">
                      {extractionSummary.wordCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-800">
                      Extraction method
                    </dt>
                    <dd className="text-slate-600">
                      {extractionSummary.extractionMethod}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-800">Characters</dt>
                    <dd className="text-slate-600">
                      {extractionSummary.charCount}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-600">
                  Text has not been extracted yet.
                </p>
              )}

              {preprocessingSummary ? (
                <div className="space-y-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-slate-800">
                        Original words
                      </dt>
                      <dd className="text-slate-600">
                        {preprocessingSummary.originalWordCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-800">
                        Sanitized words
                      </dt>
                      <dd className="text-slate-600">
                        {preprocessingSummary.sanitizedWordCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-800">
                        Removed words
                      </dt>
                      <dd className="text-slate-600">
                        {preprocessingSummary.removedWordCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-800">Chunks</dt>
                      <dd className="text-slate-600">
                        {preprocessingSummary.chunkCount}
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">
                      Rules applied
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {formatRulesApplied(preprocessingSummary.rulesApplied).map(
                        (rule) => (
                          <li key={rule}>{rule}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Sanitized text has not been prepared yet.
                  </p>
                  {detail.submission.status === "READY_FOR_SCAN" ? (
                    <PreprocessSubmissionButton
                      submissionId={detail.submission.id}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <ScanStatusPanel
            charCount={preprocessingSummary?.sanitizedTextLength ?? 0}
            hasPreprocessing={Boolean(preprocessingSummary)}
            scanSummary={scanSummary}
            status={detail.submission.status}
            statusUpdatedAt={detail.submission.updatedAt}
            submissionId={detail.submission.id}
            wordCount={preprocessingSummary?.sanitizedWordCount ?? 0}
          />
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">Storage</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-slate-800">Submission ID</dt>
              <dd className="break-all font-mono text-xs text-slate-600">
                {detail.submission.id}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">Tenant ID</dt>
              <dd className="break-all font-mono text-xs text-slate-600">
                {detail.submission.tenantId}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">File count</dt>
              <dd className="text-slate-600">{detail.files.length}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

function formatRulesApplied(rules: {
  normalizeWhitespace: true;
  removeBibliography: boolean;
  removeQuotes: boolean;
  smallMatchWordThreshold: number | null;
}): string[] {
  return [
    "Whitespace normalized",
    rules.removeBibliography
      ? "Bibliography and references removed"
      : "Bibliography and references kept",
    rules.removeQuotes ? "Quoted text removed" : "Quoted text kept",
    rules.smallMatchWordThreshold
      ? `Small matches under ${rules.smallMatchWordThreshold} words removed`
      : "Small-match threshold disabled"
  ];
}

function formatBytes(bytes: number): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: "byte",
    unitDisplay: "short"
  }).format(bytes);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
