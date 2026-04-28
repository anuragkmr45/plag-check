import { and, desc, eq, sql } from "drizzle-orm";
import {
  UnsupportedExtractionTypeError,
  extractTextFromFile
} from "../../features/extraction/extract-text";
import { getDatabase, schema, type Database } from "../../lib/db";
import { getObject, type ObjectStorageClient } from "../../lib/storage/object-storage";
import { getSubmissionById, type SubmissionSummary } from "./submissions.service";
import type { RbacUser } from "../../lib/rbac/guards";

type SubmissionStatus = (typeof schema.submissionStatus.enumValues)[number];

export type ExtractionResult = {
  extractedText: {
    charCount: number;
    extractionMethod: string;
    id: string;
    rawText: string;
    submissionId: string;
    tenantId: string;
    wordCount: number;
  };
  submission: {
    id: string;
    status: SubmissionStatus;
    wordCount: number | null;
  };
};

export type ExtractionSummary = {
  charCount: number;
  createdAt: Date;
  extractionMethod: string;
  id: string;
  wordCount: number;
};

type ExtractionOptions = {
  database?: Database;
  storageClient?: ObjectStorageClient;
};

type SubmissionFileForExtraction = {
  mimeType: string;
  originalFilename: string;
  storageKey: string;
};

type BodyWithByteArray = {
  transformToByteArray: () => Promise<Uint8Array>;
};

export class ExtractionStateError extends Error {
  readonly code = "EXTRACTION_STATE_ERROR";

  constructor(message = "Submission is not ready for extraction") {
    super(message);
    this.name = "ExtractionStateError";
  }
}

export class ExtractionFileMissingError extends Error {
  readonly code = "EXTRACTION_FILE_MISSING";

  constructor(message = "Submission file is missing") {
    super(message);
    this.name = "ExtractionFileMissingError";
  }
}

export class SubmissionExtractionNotFoundError extends Error {
  readonly code = "SUBMISSION_EXTRACTION_NOT_FOUND";

  constructor(message = "Submission not found") {
    super(message);
    this.name = "SubmissionExtractionNotFoundError";
  }
}

export { UnsupportedExtractionTypeError };

export function isSubmissionReadyForExtraction(
  submission: Pick<SubmissionSummary, "status">
): boolean {
  return submission.status === "UPLOADED";
}

export async function extractSubmissionText(
  user: RbacUser,
  submissionId: string,
  options?: ExtractionOptions
): Promise<ExtractionResult> {
  const db = options?.database ?? getDatabase();
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    throw new SubmissionExtractionNotFoundError();
  }

  if (!isSubmissionReadyForExtraction(submission)) {
    throw new ExtractionStateError();
  }

  const file = await getLatestSubmissionFile(db, submission);

  if (!file) {
    throw new ExtractionFileMissingError();
  }

  const object = await getObject(file.storageKey, options?.storageClient);
  const buffer = await objectBodyToBuffer(object.Body);
  const extracted = await extractTextFromFile({
    buffer,
    filename: file.originalFilename,
    mimeType: file.mimeType
  });

  return db.transaction(async (tx) => {
    const [extractedText] = await tx
      .insert(schema.extractedTexts)
      .values({
        charCount: extracted.charCount,
        extractionMethod: extracted.extractionMethod,
        rawText: extracted.rawText,
        submissionId: submission.id,
        tenantId: submission.tenantId,
        wordCount: extracted.wordCount
      })
      .returning({
        charCount: schema.extractedTexts.charCount,
        extractionMethod: schema.extractedTexts.extractionMethod,
        id: schema.extractedTexts.id,
        rawText: schema.extractedTexts.rawText,
        submissionId: schema.extractedTexts.submissionId,
        tenantId: schema.extractedTexts.tenantId,
        wordCount: schema.extractedTexts.wordCount
      });

    const [updatedSubmission] = await tx
      .update(schema.submissions)
      .set({
        status: "READY_FOR_SCAN",
        updatedAt: sql`now()`,
        wordCount: extracted.wordCount
      })
      .where(
        and(
          eq(schema.submissions.id, submission.id),
          eq(schema.submissions.tenantId, submission.tenantId),
          eq(schema.submissions.status, "UPLOADED")
        )
      )
      .returning({
        id: schema.submissions.id,
        status: schema.submissions.status,
        wordCount: schema.submissions.wordCount
      });

    if (!updatedSubmission) {
      throw new ExtractionStateError();
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.extract",
      actorUserId: user.id,
      entityId: extractedText.id,
      entityType: "extracted_text",
      metadata: {
        charCount: extracted.charCount,
        extractionMethod: extracted.extractionMethod,
        originalFilename: file.originalFilename,
        storageKey: file.storageKey,
        submissionId: submission.id,
        wordCount: extracted.wordCount
      },
      tenantId: submission.tenantId
    });

    return {
      extractedText,
      submission: updatedSubmission
    };
  });
}

export async function getExtractionSummaryForSubmission(
  user: RbacUser,
  submissionId: string,
  options?: ExtractionOptions
): Promise<ExtractionSummary | null> {
  const db = options?.database ?? getDatabase();
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    return null;
  }

  const [extractedText] = await db
    .select({
      charCount: schema.extractedTexts.charCount,
      createdAt: schema.extractedTexts.createdAt,
      extractionMethod: schema.extractedTexts.extractionMethod,
      id: schema.extractedTexts.id,
      wordCount: schema.extractedTexts.wordCount
    })
    .from(schema.extractedTexts)
    .where(
      and(
        eq(schema.extractedTexts.tenantId, submission.tenantId),
        eq(schema.extractedTexts.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.extractedTexts.createdAt))
    .limit(1);

  return extractedText ?? null;
}

async function getLatestSubmissionFile(
  db: Database,
  submission: Pick<SubmissionSummary, "id" | "tenantId">
): Promise<SubmissionFileForExtraction | null> {
  const [file] = await db
    .select({
      mimeType: schema.submissionFiles.mimeType,
      originalFilename: schema.submissionFiles.originalFilename,
      storageKey: schema.submissionFiles.storageKey
    })
    .from(schema.submissionFiles)
    .where(
      and(
        eq(schema.submissionFiles.tenantId, submission.tenantId),
        eq(schema.submissionFiles.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.submissionFiles.createdAt))
    .limit(1);

  return file ?? null;
}

async function objectBodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body || !hasTransformToByteArray(body)) {
    throw new ExtractionFileMissingError("Stored object body is missing");
  }

  return Buffer.from(await body.transformToByteArray());
}

function hasTransformToByteArray(body: unknown): body is BodyWithByteArray {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const candidate = body as Partial<BodyWithByteArray>;

  return typeof candidate.transformToByteArray === "function";
}
