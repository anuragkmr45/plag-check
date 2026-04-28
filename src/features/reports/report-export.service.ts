import { and, desc, eq } from "drizzle-orm";
import { getDatabase, schema, type Database } from "../../lib/db";
import type { RbacUser } from "../../lib/rbac/guards";
import {
  buildTenantReportStorageKey,
  getObjectStorageConfig,
  putObject,
  type ObjectStorageClient
} from "../../lib/storage/object-storage";
import { getReportJsonForSubmission, type ReportJson } from "./report.service";
import { renderReportPdf } from "./report-pdf";

export type GeneratedReportPdf = {
  filename: string;
  pdfBuffer: Buffer;
  snapshot: {
    id: string;
    pdfStorageKey: string;
    snapshotVersion: number;
  };
};

type ReportExportOptions = {
  database?: Database;
  generatedAt?: Date;
  storageClient?: ObjectStorageClient;
};

export class ReportPdfNotFoundError extends Error {
  readonly code = "REPORT_PDF_NOT_FOUND";

  constructor(message = "Report not found") {
    super(message);
    this.name = "ReportPdfNotFoundError";
  }
}

export async function generateSubmissionReportPdf(
  user: RbacUser,
  submissionId: string,
  options: ReportExportOptions = {}
): Promise<GeneratedReportPdf> {
  const db = options.database ?? getDatabase();
  const report = await getReportJsonForSubmission(user, submissionId, {
    database: db,
    generatedAt: options.generatedAt
  });

  if (!report) {
    throw new ReportPdfNotFoundError();
  }

  const snapshotVersion = await getNextSnapshotVersion(db, report);
  const filename = buildReportFilename(report, snapshotVersion);
  const pdfStorageKey = buildTenantReportStorageKey(
    report.tenant.id,
    report.submission.id,
    filename
  );
  const pdfBuffer = await renderReportPdf(report);
  const storage = getObjectStorageConfig();

  await putObject(
    {
      body: pdfBuffer,
      contentType: "application/pdf",
      key: pdfStorageKey,
      metadata: {
        createdByUserId: user.id,
        scanResultId: report.scan.id,
        snapshotVersion: String(snapshotVersion),
        submissionId: report.submission.id,
        tenantId: report.tenant.id
      }
    },
    options.storageClient
  );

  const [snapshot] = await db
    .insert(schema.reportSnapshots)
    .values({
      createdByUserId: user.id,
      pdfStorageKey,
      reportJson: report,
      scanResultId: report.scan.id,
      snapshotVersion,
      submissionId: report.submission.id,
      tenantId: report.tenant.id
    })
    .returning({
      id: schema.reportSnapshots.id,
      pdfStorageKey: schema.reportSnapshots.pdfStorageKey,
      snapshotVersion: schema.reportSnapshots.snapshotVersion
    });

  await db.insert(schema.auditEvents).values({
    action: "report.pdf.generated",
    actorUserId: user.id,
    entityId: snapshot.id,
    entityType: "report_snapshot",
    metadata: {
      pdfStorageBucket: storage.bucket,
      pdfStorageKey,
      scanResultId: report.scan.id,
      snapshotVersion,
      submissionId: report.submission.id
    },
    tenantId: report.tenant.id
  });

  return {
    filename,
    pdfBuffer,
    snapshot: {
      id: snapshot.id,
      pdfStorageKey: snapshot.pdfStorageKey ?? pdfStorageKey,
      snapshotVersion: snapshot.snapshotVersion
    }
  };
}

async function getNextSnapshotVersion(
  db: Database,
  report: ReportJson
): Promise<number> {
  const [latestSnapshot] = await db
    .select({
      snapshotVersion: schema.reportSnapshots.snapshotVersion
    })
    .from(schema.reportSnapshots)
    .where(
      and(
        eq(schema.reportSnapshots.tenantId, report.tenant.id),
        eq(schema.reportSnapshots.submissionId, report.submission.id)
      )
    )
    .orderBy(desc(schema.reportSnapshots.snapshotVersion))
    .limit(1);

  return (latestSnapshot?.snapshotVersion ?? 0) + 1;
}

function buildReportFilename(report: ReportJson, snapshotVersion: number): string {
  const safeTitle = report.submission.title
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${safeTitle || "report"}-v${snapshotVersion}.pdf`;
}
