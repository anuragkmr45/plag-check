import { TenantBrandMark } from "../tenants/tenant-brand-mark";
import type { ReportJson } from "./report.service";
import {
  buildReportVisualSummary,
  formatAssessmentLabel,
  formatCharacterRange,
  formatExclusionRules,
  formatMetadataEntries,
  formatReplacementSuggestions,
  formatReportProbability,
  formatReportScore,
  formatVisualPercent,
  type ReportVisualBand,
  type ReportVisualSummary
} from "./report-view";

type ReportPageContentProps = {
  report: ReportJson;
};

export function ReportPageContent({
  report
}: ReportPageContentProps): React.JSX.Element {
  const metadataEntries = formatMetadataEntries(report.scan.providerMetadata);
  const providerBadge = getProviderBadge(report.scan.providerMetadata);
  const academicMatches = getAcademicMatches(report.scan.providerMetadata);
  const writingNotes = getWritingPatternNotes(report.scan.providerMetadata);
  const subproviderStatuses = getSubproviderStatuses(report.scan.providerMetadata);
  const exclusionRules = report.preprocessing
    ? formatExclusionRules(report.preprocessing.rulesApplied)
    : [];
  const primaryColor = report.tenant.branding.primaryColor ?? "#0f172a";
  const highlightedChunks = buildHighlightedChunks(report);
  const visualSummary = buildReportVisualSummary({
    aiProbability: report.scan.aiProbability,
    grammarFindingCount: report.scan.grammarFindings.length,
    originalWordCount:
      report.preprocessing?.originalWordCount ?? report.scan.originalWordCount,
    removedWordCount: report.preprocessing?.removedWordCount,
    scannedWordCount:
      report.preprocessing?.sanitizedWordCount ?? report.scan.scannedWordCount,
    similarityScore: report.scan.similarityScore,
    sourceMatches: report.scan.sourceMatches
  });

  return (
    <article className="space-y-6">
      <header
        className="rounded-lg border border-t-4 border-slate-200 bg-white p-5"
        style={{ borderTopColor: primaryColor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <TenantBrandMark
              label={report.tenant.name}
              logoUrl={report.tenant.branding.logoUrl}
              primaryColor={primaryColor}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-600">
                {report.tenant.name}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {report.submission.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {report.disclaimer}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                providerBadge.fallback
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-100 text-emerald-900"
              }`}
            >
              {providerBadge.label}
            </span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
              {report.submission.status}
            </span>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem label="Report generated" value={formatDate(report.generatedAt)} />
          <MetadataItem label="Scan timestamp" value={formatDate(report.scan.createdAt)} />
          <MetadataItem
            label="Scanned words"
            value={`${report.scan.scannedWordCount} of ${report.scan.originalWordCount}`}
          />
          <MetadataItem label="Files" value={String(report.files.length)} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href={`/api/submissions/${report.submission.id}/report/pdf`}
          >
            Export PDF
          </a>
          {providerBadge.fallback ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Fallback indicators are present
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="similarity-heading"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"
        >
          <p className="text-sm font-medium text-emerald-900">
            Similarity analysis
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h2
                className="text-base font-semibold text-emerald-950"
                id="similarity-heading"
              >
                Overall similarity score
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Based on source matches returned by the scan provider.
              </p>
            </div>
            <p className="text-4xl font-semibold text-emerald-950">
              {formatReportScore(report.scan.similarityScore)}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="ai-heading"
          className="rounded-lg border border-sky-200 bg-sky-50 p-5"
        >
          <p className="text-sm font-medium text-sky-900">
            AI writing indicators
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h2
                className="text-base font-semibold text-sky-950"
                id="ai-heading"
              >
                AI probability
              </h2>
              <p className="mt-1 text-sm text-sky-800">
                Reported separately from similarity evidence.
              </p>
            </div>
            <p className="text-4xl font-semibold text-sky-950">
              {formatReportProbability(report.scan.aiProbability)}
            </p>
          </div>
        </section>
      </div>

      <VisualAnalysisSection
        primaryColor={primaryColor}
        summary={visualSummary}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Each matched excerpt is shown with its source and match score."
              title="Source-wise matches"
            />
            {report.scan.sourceMatches.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {report.scan.sourceMatches.map((match, index) => (
                  <li className="space-y-3 px-5 py-4" key={`${match.sourceTitle}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-950">
                          {match.sourceTitle}
                        </h3>
                        {match.sourceUrl ? (
                          <a
                            className="mt-1 block break-all text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
                            href={match.sourceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {match.sourceUrl}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-slate-600">
                            No source URL recorded.
                          </p>
                        )}
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800">
                        {formatReportScore(match.similarityScore)}
                      </span>
                    </div>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Characters {formatCharacterRange(match.startChar, match.endChar)}
                    </p>
                    <blockquote className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-900">
                      <mark className="bg-amber-200 px-1 text-slate-950">
                        {match.matchedText}
                      </mark>
                    </blockquote>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No source matches were returned for this scan." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="OpenAlex metadata is used only as a demo academic discovery signal."
              title="Academic metadata matches"
            />
            {academicMatches.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {academicMatches.map((match, index) => (
                  <li className="space-y-2 px-5 py-4" key={`${match.title}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-950">
                          {match.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {[
                            match.publicationYear
                              ? String(match.publicationYear)
                              : null,
                            match.source,
                            match.authors.slice(0, 3).join(", ")
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Metadata only"}
                        </p>
                      </div>
                      {match.openAlexUrl || match.doi ? (
                        <a
                          className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
                          href={match.doi ?? match.openAlexUrl ?? "#"}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open source
                        </a>
                      ) : null}
                    </div>
                    {match.abstractSnippet ? (
                      <p className="text-sm leading-6 text-slate-600">
                        {match.abstractSnippet}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No academic metadata matches were returned for this scan." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="AI assessments are displayed as individual writing sections."
              title="AI-assessed sections"
            />
            {writingNotes.length > 0 ? (
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-medium text-slate-800">
                  Writing pattern notes
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {writingNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {report.scan.aiAssessments.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {report.scan.aiAssessments.map((assessment, index) => (
                  <li className="space-y-2 px-5 py-4" key={`${assessment.sentenceStartChar}-${index}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-medium text-slate-950">
                        {formatAssessmentLabel(assessment.label)}
                      </h3>
                      <span className="rounded-md bg-sky-100 px-2 py-1 text-sm font-medium text-sky-900">
                        {formatReportProbability(assessment.probability)}
                      </span>
                    </div>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Characters{" "}
                      {formatCharacterRange(
                        assessment.sentenceStartChar,
                        assessment.sentenceEndChar
                      )}
                    </p>
                    <p className="text-sm text-slate-600">
                      {assessment.explanation ??
                        "No provider explanation recorded for this section."}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No AI section assessments were returned for this scan." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Submitted excerpts that need reviewer attention."
              title="Highlighted submitted chunks"
            />
            {highlightedChunks.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {highlightedChunks.map((chunk, index) => (
                  <li className="space-y-2 px-5 py-4" key={`${chunk.range}-${index}`}>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      {chunk.kind} · Characters {chunk.range}
                    </p>
                    <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">
                      {chunk.text}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No highlighted chunks were available." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Grammar and spelling findings are provider indicators only."
              title="Grammar findings"
            />
            {report.scan.grammarFindings.length > 0 ? (
              <ol className="divide-y divide-slate-100">
                {report.scan.grammarFindings.map((finding, index) => (
                  <li className="space-y-2 px-5 py-4" key={`${finding.offset}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-medium text-slate-950">
                        {finding.message}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        Characters{" "}
                        {formatCharacterRange(
                          finding.offset,
                          finding.offset + finding.length
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Suggestions:{" "}
                      {formatReplacementSuggestions(
                        finding.replacementSuggestions
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No grammar findings were returned for this scan." />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Text excluded before scanning is summarized here."
              title="Exclusions summary"
            />
            {report.preprocessing ? (
              <div className="space-y-4 p-5">
                <dl className="grid gap-3 text-sm">
                  <MetadataItem
                    label="Original words"
                    value={String(report.preprocessing.originalWordCount)}
                  />
                  <MetadataItem
                    label="Sanitized words"
                    value={String(report.preprocessing.sanitizedWordCount)}
                  />
                  <MetadataItem
                    label="Removed words"
                    value={String(report.preprocessing.removedWordCount)}
                  />
                </dl>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {exclusionRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState message="No preprocessing run was recorded for this report." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Subprovider calls and fallback state for this scan."
              title="Demo provider status"
            />
            {subproviderStatuses.length > 0 ? (
              <dl className="space-y-3 p-5 text-sm">
                {subproviderStatuses.map((entry) => (
                  <MetadataItem
                    key={entry.label}
                    label={entry.label}
                    value={entry.value}
                  />
                ))}
              </dl>
            ) : (
              <EmptyState message="No subprovider status was recorded." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Provider details are stored with the scan result."
              title="Provider metadata"
            />
            {metadataEntries.length > 0 ? (
              <dl className="space-y-3 p-5 text-sm">
                {metadataEntries.map((entry) => (
                  <MetadataItem
                    key={entry.label}
                    label={entry.label}
                    value={entry.value}
                  />
                ))}
              </dl>
            ) : (
              <EmptyState message="No provider metadata was recorded." />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader title="Files and extraction" />
            <div className="space-y-4 p-5">
              {report.extraction ? (
                <dl className="grid gap-3 text-sm">
                  <MetadataItem
                    label="Extracted words"
                    value={String(report.extraction.wordCount)}
                  />
                  <MetadataItem
                    label="Characters"
                    value={String(report.extraction.charCount)}
                  />
                  <MetadataItem
                    label="Extraction method"
                    value={report.extraction.extractionMethod}
                  />
                </dl>
              ) : (
                <p className="text-sm text-slate-600">
                  No extraction summary was recorded.
                </p>
              )}

              {report.files.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-600">
                  {report.files.map((file) => (
                    <li className="break-words" key={file.id}>
                      {file.originalFilename}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">
                  No files are attached to this submission.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <SectionHeader
              description="Reviewer workflow state and notes connected to this report."
              title="Reviewer notes"
            />
            <div className="space-y-4 p-5">
              {report.review.case ? (
                <dl className="grid gap-3 text-sm">
                  <MetadataItem label="Case status" value={report.review.case.status} />
                  <MetadataItem
                    label="Final decision"
                    value={report.review.case.finalDecision ?? "Pending"}
                  />
                  <MetadataItem
                    label="Assigned reviewer"
                    value={report.review.case.assignedReviewerId ?? "Unassigned"}
                  />
                </dl>
              ) : (
                <p className="text-sm text-slate-600">
                  No review case is attached to this report.
                </p>
              )}
              {report.review.notes.length > 0 ? (
                <ol className="space-y-3">
                  {report.review.notes.map((note) => (
                    <li
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                      key={note.id}
                    >
                      <p className="text-sm text-slate-900">{note.comment}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {note.eventType} · {formatDate(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      {report.tenant.branding.reportFooter ? (
        <footer className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          {report.tenant.branding.reportFooter}
        </footer>
      ) : null}
    </article>
  );
}

function SectionHeader({
  description,
  id,
  title
}: {
  description?: string;
  id?: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-base font-semibold text-slate-950" id={id}>
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function MetadataItem({
  label,
  value
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="font-medium text-slate-800">{label}</dt>
      <dd className="mt-1 break-words text-slate-600">{value}</dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="p-5">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

function VisualAnalysisSection({
  primaryColor,
  summary
}: {
  primaryColor: string;
  summary: ReportVisualSummary;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="visual-analysis-heading"
      className="rounded-lg border border-slate-200 bg-white"
    >
      <SectionHeader
        description="Score breakdowns are indicators for reviewer analysis, not automated decisions."
        id="visual-analysis-heading"
        title="Visual analysis"
      />
      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Similarity and originality
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {summary.similarity.band.description}
              </p>
            </div>
            <VisualBandBadge band={summary.similarity.band} />
          </div>
          <SegmentedVisualBar
            accentColor={primaryColor}
            primaryLabel="Copied estimate"
            primaryValue={summary.similarity.copiedPercent}
            secondaryLabel="Original estimate"
            secondaryValue={summary.similarity.originalPercent}
            title="Similarity split"
          />
          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                AI writing indicators
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {summary.ai.band.description}
              </p>
            </div>
            <VisualBandBadge band={summary.ai.band} />
          </div>
          <SegmentedVisualBar
            accentColor="#0284c7"
            primaryLabel="AI-like indicator"
            primaryValue={summary.ai.aiPercent}
            secondaryLabel="Human-like indicator"
            secondaryValue={summary.ai.humanPercent}
            title="AI writing split"
          />
          <SegmentedVisualBar
            accentColor="#0f766e"
            primaryLabel="Scanned text"
            primaryValue={summary.preprocessing.scannedPercent}
            secondaryLabel="Excluded text"
            secondaryValue={summary.preprocessing.excludedPercent}
            title="Preprocessing split"
          />
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <MetadataItem
              label="Scanned words"
              value={`${summary.preprocessing.scannedWords} of ${summary.preprocessing.totalWords}`}
            />
            <MetadataItem
              label="Excluded words"
              value={`${summary.preprocessing.excludedWords} (${formatVisualPercent(
                summary.preprocessing.excludedPercent
              )})`}
            />
            <MetadataItem
              label="Grammar density"
              value={summary.grammar.densityLabel}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Top source match scores
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Highest source-level match scores returned for this scan.
              </p>
            </div>
          </div>
          {summary.topSources.length > 0 ? (
            <ol className="space-y-3">
              {summary.topSources.map((source) => (
                <li className="space-y-1.5" key={`${source.rank}-${source.label}`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {source.rank}. {source.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-950">
                      {formatVisualPercent(source.score)}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: toPercentWidth(source.score) }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">
              No source score chart is available for this scan.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function VisualBandBadge({
  band
}: {
  band: ReportVisualBand;
}): React.JSX.Element {
  const className =
    band.tone === "high"
      ? "bg-rose-100 text-rose-900"
      : band.tone === "moderate"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-900";

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${className}`}>
      {band.label}
    </span>
  );
}

function SegmentedVisualBar({
  accentColor,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  title
}: {
  accentColor: string;
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
  title: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{title}</span>
        <span className="font-semibold text-slate-950">
          {primaryLabel}: {formatVisualPercent(primaryValue)}
        </span>
      </div>
      <div
        aria-label={`${title}: ${primaryLabel} ${formatVisualPercent(
          primaryValue
        )}, ${secondaryLabel} ${formatVisualPercent(secondaryValue)}`}
        className="flex h-3 overflow-hidden rounded-full bg-slate-100"
        role="img"
      >
        <div
          className="h-full"
          style={{
            backgroundColor: accentColor,
            width: toPercentWidth(primaryValue)
          }}
        />
        <div
          className="h-full bg-slate-300"
          style={{ width: toPercentWidth(secondaryValue) }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-3 text-xs text-slate-500">
        <span>
          {primaryLabel} {formatVisualPercent(primaryValue)}
        </span>
        <span>
          {secondaryLabel} {formatVisualPercent(secondaryValue)}
        </span>
      </div>
    </div>
  );
}

type AcademicMatch = {
  abstractSnippet: string | null;
  authors: string[];
  doi: string | null;
  openAlexUrl: string | null;
  publicationYear: number | null;
  source: string | null;
  title: string;
};

type HighlightedChunk = {
  kind: string;
  range: string;
  text: string;
};

function getProviderBadge(metadata: unknown): {
  fallback: boolean;
  label: string;
} {
  const record = toRecord(metadata);
  const provider = typeof record?.provider === "string" ? record.provider : "mock";
  const fallback = record?.fallback === true;

  return {
    fallback,
    label:
      provider === "demo-real"
        ? fallback
          ? "Demo Real · fallback"
          : "Demo Real"
        : "Mock"
  };
}

function getAcademicMatches(metadata: unknown): AcademicMatch[] {
  const record = toRecord(metadata);

  if (!Array.isArray(record?.academicMatches)) {
    return [];
  }

  return record.academicMatches
    .map((value) => {
      const match = toRecord(value);

      if (!match || typeof match.title !== "string") {
        return null;
      }

      return {
        abstractSnippet:
          typeof match.abstractSnippet === "string"
            ? match.abstractSnippet
            : null,
        authors: Array.isArray(match.authors)
          ? match.authors.filter((author): author is string => typeof author === "string")
          : [],
        doi: typeof match.doi === "string" ? match.doi : null,
        openAlexUrl:
          typeof match.openAlexUrl === "string" ? match.openAlexUrl : null,
        publicationYear:
          typeof match.publicationYear === "number" ? match.publicationYear : null,
        source: typeof match.source === "string" ? match.source : null,
        title: match.title
      } satisfies AcademicMatch;
    })
    .filter((match): match is AcademicMatch => Boolean(match));
}

function getWritingPatternNotes(metadata: unknown): string[] {
  const record = toRecord(metadata);

  return Array.isArray(record?.writingPatternNotes)
    ? record.writingPatternNotes.filter(
        (note): note is string => typeof note === "string"
      )
    : [];
}

function getSubproviderStatuses(metadata: unknown): Array<{
  label: string;
  value: string;
}> {
  const record = toRecord(metadata);
  const subproviders = toRecord(record?.subproviders);

  if (!subproviders) {
    return [];
  }

  return Object.entries(subproviders).map(([key, value]) => {
    const status = toRecord(value);
    const provider =
      typeof status?.provider === "string" ? status.provider : "unknown";
    const fallback = status?.fallback === true ? "fallback" : "live";
    const reason =
      typeof status?.reason === "string" ? ` · ${status.reason}` : "";

    return {
      label: key,
      value: `${provider} · ${fallback}${reason}`
    };
  });
}

function buildHighlightedChunks(report: ReportJson): HighlightedChunk[] {
  const sourceChunks = report.scan.sourceMatches.slice(0, 5).map((match) => ({
    kind: "Source match",
    range: formatCharacterRange(match.startChar, match.endChar),
    text: match.matchedText
  }));
  const aiChunks = report.scan.aiAssessments.slice(0, 3).map((assessment) => ({
    kind: "AI indicator",
    range: formatCharacterRange(
      assessment.sentenceStartChar,
      assessment.sentenceEndChar
    ),
    text: assessment.explanation ?? formatAssessmentLabel(assessment.label)
  }));

  return [...sourceChunks, ...aiChunks];
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toPercentWidth(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.min(100, Math.max(0, value))}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
