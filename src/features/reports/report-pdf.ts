import { Buffer } from "node:buffer";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { ReportJson } from "./report.service";
import {
  buildReportVisualSummary,
  formatExclusionRules,
  formatReplacementSuggestions,
  formatReportProbability,
  formatReportScore,
  formatVisualPercent,
  type ReportVisualSummary
} from "./report-view";

const PDF_COLORS = {
  amber: "#f59e0b",
  border: "#dbe4ee",
  emerald: "#059669",
  muted: "#64748b",
  mutedText: "#475569",
  slate: "#0f172a",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  sky: "#0284c7",
  teal: "#0f766e",
  white: "#ffffff"
} as const;

export async function renderReportPdf(report: ReportJson): Promise<Buffer> {
  const doc = new PDFDocument({
    bufferPages: true,
    info: {
      Author: report.tenant.name,
      Subject: "Similarity and AI indicator report",
      Title: report.submission.title
    },
    margin: 48,
    size: "A4"
  });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.from(chunk));
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
  });

  writeReportPdf(doc, report);
  doc.end();

  return completed;
}

function writeReportPdf(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeTitle(doc, report);
  writeVisualSummary(doc, report);
  writeSection(doc, "Submission details", [
    ["Submission ID", report.submission.id],
    ["Status", report.submission.status],
    ["Created", formatDate(report.submission.createdAt)],
    ["Updated", formatDate(report.submission.updatedAt)],
    ["Word count", report.submission.wordCount?.toString() ?? "Not recorded"]
  ]);
  writeFileDetails(doc, report);
  writeSection(doc, "Similarity analysis", [
    ["Overall similarity score", formatReportScore(report.scan.similarityScore)],
    ["Source matches", report.scan.sourceMatches.length.toString()]
  ]);
  writeSourceMatches(doc, report);
  writeSection(doc, "AI writing indicators", [
    ["AI probability", formatReportProbability(report.scan.aiProbability)],
    ["AI-assessed sections", report.scan.aiAssessments.length.toString()]
  ]);
  writeAiAssessments(doc, report);
  writeGrammarFindings(doc, report);
  writeExclusions(doc, report);
  writeReviewerNotes(doc, report);
  writeSection(doc, "Audit and report timestamp", [
    ["Report generated", formatDate(report.generatedAt)],
    ["Scan timestamp", formatDate(report.scan.createdAt)],
    ["Scan job ID", report.scan.scanJobId]
  ]);
  writeDisclaimer(doc, report.disclaimer);
  writeFooter(doc, report);
  writePageNumbers(doc, report);
}

function writeTitle(doc: PDFKit.PDFDocument, report: ReportJson): void {
  const x = doc.page.margins.left;
  const y = doc.y;
  const width = getContentWidth(doc);
  const accentColor = normalizePdfColor(report.tenant.branding.primaryColor);
  const logoLabel =
    report.tenant.branding.logoUrl ??
    report.tenant.branding.logoStorageKey ??
    "Not configured";

  doc.save();
  doc.rect(x, y, width, 104).fillAndStroke(PDF_COLORS.slate100, PDF_COLORS.border);
  doc.rect(x, y, 7, 104).fill(accentColor);
  doc.restore();

  doc
    .fillColor(PDF_COLORS.mutedText)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(report.tenant.name, x + 20, y + 16, {
      width: width - 40
    });
  doc
    .fillColor(PDF_COLORS.slate)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(report.submission.title, x + 20, y + 34, {
      width: width - 40
    });
  doc
    .fillColor(PDF_COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(`Similarity and AI indicator report - Generated ${formatDate(report.generatedAt)}`, x + 20, y + 66, {
      width: width - 40
    })
    .text(`Logo: ${logoLabel}`, x + 20, y + 82, {
      width: width - 40
    });
  doc.y = y + 124;
}

function writeVisualSummary(
  doc: PDFKit.PDFDocument,
  report: ReportJson
): void {
  const summary = buildReportVisualSummary({
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

  writeHeading(doc, "Visual summary");
  writeMetricCards(doc, [
    {
      accentColor: PDF_COLORS.emerald,
      label: "Similarity",
      note: summary.similarity.band.label,
      value: formatVisualPercent(summary.similarity.copiedPercent)
    },
    {
      accentColor: PDF_COLORS.slate,
      label: "Original estimate",
      note: "After provider matching",
      value: formatVisualPercent(summary.similarity.originalPercent)
    },
    {
      accentColor: PDF_COLORS.sky,
      label: "AI probability",
      note: summary.ai.band.label,
      value: formatVisualPercent(summary.ai.aiPercent)
    },
    {
      accentColor: PDF_COLORS.amber,
      label: "Grammar findings",
      note: summary.grammar.densityLabel,
      value: String(summary.grammar.findingCount)
    }
  ]);
  writeHorizontalBar(doc, {
    accentColor: PDF_COLORS.emerald,
    primaryLabel: "Copied estimate",
    primaryValue: summary.similarity.copiedPercent,
    secondaryLabel: "Original estimate",
    secondaryValue: summary.similarity.originalPercent,
    title: "Similarity split"
  });
  writeHorizontalBar(doc, {
    accentColor: PDF_COLORS.sky,
    primaryLabel: "AI-like indicator",
    primaryValue: summary.ai.aiPercent,
    secondaryLabel: "Human-like indicator",
    secondaryValue: summary.ai.humanPercent,
    title: "AI writing split"
  });
  writeHorizontalBar(doc, {
    accentColor: PDF_COLORS.teal,
    primaryLabel: "Scanned text",
    primaryValue: summary.preprocessing.scannedPercent,
    secondaryLabel: "Excluded text",
    secondaryValue: summary.preprocessing.excludedPercent,
    title: "Preprocessing split"
  });
  writeTopSourceChart(doc, summary);
}

function writeFileDetails(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "File details");

  if (report.files.length === 0) {
    writeText(doc, "No files are attached to this report.");
    return;
  }

  for (const file of report.files) {
    writeText(doc, `${file.originalFilename} (${file.mimeType}, ${file.fileSizeBytes} bytes)`);
    writeText(doc, `Checksum: ${file.checksumSha256}`);
  }

  doc.moveDown(0.5);
}

function writeSourceMatches(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "Source matches");

  if (report.scan.sourceMatches.length === 0) {
    writeText(doc, "No source matches were returned for this scan.");
    return;
  }

  for (const match of report.scan.sourceMatches) {
    writeText(
      doc,
      `${match.sourceTitle} - ${formatReportScore(match.similarityScore)} - characters ${match.startChar}-${match.endChar}`
    );
    writeText(doc, `Source URL: ${match.sourceUrl ?? "Not recorded"}`);
    writeText(doc, `Matched text: ${match.matchedText}`);
    doc.moveDown(0.35);
  }
}

function writeAiAssessments(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "AI-assessed sections");

  if (report.scan.aiAssessments.length === 0) {
    writeText(doc, "No AI section assessments were returned for this scan.");
    return;
  }

  for (const assessment of report.scan.aiAssessments) {
    writeText(
      doc,
      `${assessment.label} - ${formatReportProbability(assessment.probability)} - characters ${assessment.sentenceStartChar}-${assessment.sentenceEndChar}`
    );
    writeText(doc, assessment.explanation ?? "No provider explanation recorded.");
    doc.moveDown(0.35);
  }
}

function writeGrammarFindings(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "Grammar findings");

  if (report.scan.grammarFindings.length === 0) {
    writeText(doc, "No grammar findings were returned for this scan.");
    return;
  }

  for (const finding of report.scan.grammarFindings) {
    writeText(
      doc,
      `${finding.message} - characters ${finding.offset}-${finding.offset + finding.length}`
    );
    writeText(
      doc,
      `Suggestions: ${formatReplacementSuggestions(finding.replacementSuggestions)}`
    );
    doc.moveDown(0.35);
  }
}

function writeExclusions(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "Exclusions summary");

  if (!report.preprocessing) {
    writeText(doc, "No preprocessing run was recorded for this report.");
    return;
  }

  writeText(doc, `Original words: ${report.preprocessing.originalWordCount}`);
  writeText(doc, `Sanitized words: ${report.preprocessing.sanitizedWordCount}`);
  writeText(doc, `Removed words: ${report.preprocessing.removedWordCount}`);

  for (const rule of formatExclusionRules(report.preprocessing.rulesApplied)) {
    writeText(doc, `- ${rule}`);
  }
}

function writeReviewerNotes(doc: PDFKit.PDFDocument, report: ReportJson): void {
  writeHeading(doc, "Reviewer notes");

  if (report.review.notes.length === 0) {
    writeText(doc, "No reviewer notes were recorded.");
    return;
  }

  for (const note of report.review.notes) {
    writeText(doc, `${formatDate(note.createdAt)} - ${note.eventType}`);
    writeText(doc, note.comment);
    doc.moveDown(0.35);
  }
}

function writeDisclaimer(doc: PDFKit.PDFDocument, disclaimer: string): void {
  writeHeading(doc, "Disclaimer");
  writeText(doc, disclaimer);
}

function writeFooter(doc: PDFKit.PDFDocument, report: ReportJson): void {
  if (!report.tenant.branding.reportFooter) {
    return;
  }

  writeHeading(doc, "Report footer");
  writeText(doc, report.tenant.branding.reportFooter);
}

function writeSection(
  doc: PDFKit.PDFDocument,
  heading: string,
  rows: Array<[string, string]>
): void {
  writeHeading(doc, heading);

  for (const [label, value] of rows) {
    writeText(doc, `${label}: ${value}`);
  }

  doc.moveDown(0.5);
}

function writeMetricCards(
  doc: PDFKit.PDFDocument,
  metrics: Array<{
    accentColor: string;
    label: string;
    note: string;
    value: string;
  }>
): void {
  ensureSpace(doc, 96);

  const x = doc.page.margins.left;
  const y = doc.y;
  const gap = 8;
  const cardWidth = (getContentWidth(doc) - gap * (metrics.length - 1)) / metrics.length;
  const cardHeight = 68;

  metrics.forEach((metric, index) => {
    const cardX = x + index * (cardWidth + gap);

    doc.save();
    doc
      .rect(cardX, y, cardWidth, cardHeight)
      .fillAndStroke(PDF_COLORS.white, PDF_COLORS.border);
    doc.rect(cardX, y, cardWidth, 4).fill(metric.accentColor);
    doc.restore();

    doc
      .fillColor(PDF_COLORS.mutedText)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text(metric.label.toUpperCase(), cardX + 9, y + 12, {
        width: cardWidth - 18
      });
    doc
      .fillColor(metric.accentColor)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(metric.value, cardX + 9, y + 28, {
        width: cardWidth - 18
      });
    doc
      .fillColor(PDF_COLORS.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(metric.note, cardX + 9, y + 50, {
        ellipsis: true,
        width: cardWidth - 18
      });
  });

  doc.y = y + cardHeight + 12;
}

function writeHorizontalBar(
  doc: PDFKit.PDFDocument,
  bar: {
    accentColor: string;
    primaryLabel: string;
    primaryValue: number;
    secondaryLabel: string;
    secondaryValue: number;
    title: string;
  }
): void {
  ensureSpace(doc, 50);

  const x = doc.page.margins.left;
  const width = getContentWidth(doc);

  doc
    .fillColor(PDF_COLORS.slate)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `${bar.title}: ${bar.primaryLabel} ${formatVisualPercent(
        bar.primaryValue
      )} - ${bar.secondaryLabel} ${formatVisualPercent(bar.secondaryValue)}`,
      x,
      doc.y,
      {
        width
      }
    );

  const y = doc.y + 5;
  const height = 10;
  const primaryWidth = (width * clampPercent(bar.primaryValue)) / 100;
  const secondaryWidth = (width * clampPercent(bar.secondaryValue)) / 100;

  doc.save();
  doc.rect(x, y, width, height).fill(PDF_COLORS.slate200);
  doc.rect(x, y, primaryWidth, height).fill(bar.accentColor);
  if (secondaryWidth > 0) {
    doc
      .rect(x + primaryWidth, y, Math.min(width - primaryWidth, secondaryWidth), height)
      .fill(PDF_COLORS.slate200);
  }
  doc.restore();

  doc.y = y + height + 10;
}

function writeTopSourceChart(
  doc: PDFKit.PDFDocument,
  summary: ReportVisualSummary
): void {
  writeHeading(doc, "Top source match scores");

  if (summary.topSources.length === 0) {
    writeText(doc, "No source score chart is available for this scan.");
    return;
  }

  for (const source of summary.topSources) {
    ensureSpace(doc, 38);

    doc
      .fillColor(PDF_COLORS.slate)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        `${source.rank}. ${truncateText(source.label, 72)} - ${formatVisualPercent(
          source.score
        )}`,
        doc.page.margins.left,
        doc.y,
        {
          width: getContentWidth(doc)
        }
      );

    const x = doc.page.margins.left;
    const y = doc.y + 4;
    const width = getContentWidth(doc);
    const barWidth = (width * clampPercent(source.score)) / 100;

    doc.save();
    doc.rect(x, y, width, 8).fill(PDF_COLORS.slate200);
    doc.rect(x, y, barWidth, 8).fill(PDF_COLORS.amber);
    doc.restore();

    doc.y = y + 14;
  }
}

function writeHeading(doc: PDFKit.PDFDocument, heading: string): void {
  ensureSpace(doc, 90);
  doc.moveDown(0.4);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(PDF_COLORS.slate)
    .text(heading, doc.page.margins.left, doc.y, {
      width: getContentWidth(doc)
    });
  doc.moveDown(0.25);
}

function writeText(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 48);
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(PDF_COLORS.slate)
    .text(text, doc.page.margins.left, doc.y, {
      lineGap: 2,
      width: getContentWidth(doc)
    });
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number): void {
  if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function writePageNumbers(
  doc: PDFKit.PDFDocument,
  report: ReportJson
): void {
  const range = doc.bufferedPageRange();

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    doc
      .fillColor(PDF_COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `${report.tenant.name} - Page ${index + 1} of ${range.count}`,
        doc.page.margins.left,
        doc.page.height - 34,
        {
          align: "center",
          width: getContentWidth(doc)
        }
      );
  }
}

function getContentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function normalizePdfColor(value: string | null): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : PDF_COLORS.slate;
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
