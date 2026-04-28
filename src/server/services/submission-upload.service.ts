import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";
import {
  buildTenantStorageKey,
  getObjectStorageConfig,
  putObject,
  type ObjectStorageClient
} from "../../lib/storage/object-storage";

const bytesPerMegabyte = 1024 * 1024;
const oleCompoundFileSignature = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1
]);

export const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 25 * bytesPerMegabyte;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
] as const;

const uploadAllowedStatuses = ["DRAFT", "UPLOADED"] as const;
const uploadExtensionsByMimeType = {
  "application/msword": [".doc"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx"
  ],
  "text/plain": [".txt"]
} as const satisfies Record<SupportedUploadMimeType, readonly string[]>;

const tenantUploadSettingsSchema = z
  .object({
    limits: z
      .object({
        maxFileSizeBytes: z.number().int().positive().optional(),
        maxFileSizeMb: z.number().positive().optional()
      })
      .optional(),
    maxFileSizeBytes: z.number().int().positive().optional(),
    maxFileSizeMb: z.number().positive().optional()
  })
  .passthrough();

type SubmissionStatus = (typeof schema.submissionStatus.enumValues)[number];
type SupportedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export type SubmissionUploadInput = {
  data: Buffer;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
};

export type SubmissionUploadResult = {
  file: {
    checksumSha256: string;
    fileSizeBytes: number;
    id: string;
    mimeType: string;
    originalFilename: string;
    storageBucket: string;
    storageKey: string;
    submissionId: string;
    tenantId: string;
    uploadedByUserId: string;
  };
  submission: {
    id: string;
    status: SubmissionStatus;
  };
};

type SubmissionUploadOptions = {
  database?: Database;
  storageClient?: ObjectStorageClient;
};

type UploadableSubmission = {
  createdByUserId: string;
  id: string;
  status: SubmissionStatus;
  tenantId: string;
};

export class UploadValidationError extends Error {
  readonly code = "UPLOAD_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export class SubmissionUploadStateError extends Error {
  readonly code = "SUBMISSION_UPLOAD_STATE_ERROR";

  constructor(message = "Submission is not open for upload") {
    super(message);
    this.name = "SubmissionUploadStateError";
  }
}

export class SubmissionNotFoundError extends Error {
  readonly code = "SUBMISSION_NOT_FOUND";

  constructor(message = "Submission not found") {
    super(message);
    this.name = "SubmissionNotFoundError";
  }
}

export function normalizeUploadMimeType(
  mimeType: string
): SupportedUploadMimeType | null {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return ALLOWED_UPLOAD_MIME_TYPES.includes(
    normalized as SupportedUploadMimeType
  )
    ? (normalized as SupportedUploadMimeType)
    : null;
}

export function resolveMaxUploadSizeBytes(settings: unknown): number {
  const parsedSettings = tenantUploadSettingsSchema.safeParse(settings);

  if (!parsedSettings.success) {
    return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
  }

  const uploadSettings = parsedSettings.data.limits ?? parsedSettings.data;

  if (uploadSettings.maxFileSizeBytes) {
    return uploadSettings.maxFileSizeBytes;
  }

  if (uploadSettings.maxFileSizeMb) {
    return Math.floor(uploadSettings.maxFileSizeMb * bytesPerMegabyte);
  }

  return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

export function canUploadToSubmission(
  user: RbacUser,
  submission: UploadableSubmission
): boolean {
  if (!uploadAllowedStatuses.includes(submission.status as "DRAFT" | "UPLOADED")) {
    return false;
  }

  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  if (!user.tenantId || user.tenantId !== submission.tenantId) {
    return false;
  }

  if (user.role === "INSTITUTION_ADMIN") {
    return true;
  }

  return user.role === "USER" && user.id === submission.createdByUserId;
}

export function validateSubmissionUploadInput(
  input: Pick<
    SubmissionUploadInput,
    "data" | "mimeType" | "originalFilename" | "sizeBytes"
  >,
  maxSizeBytes: number
): SupportedUploadMimeType {
  const mimeType = normalizeUploadMimeType(input.mimeType);

  if (!mimeType) {
    throw new UploadValidationError("Unsupported file type");
  }

  const originalFilename = normalizeUploadFilename(input.originalFilename);

  if (!originalFilename) {
    throw new UploadValidationError("File name is required");
  }

  if (!isSafeUploadFilename(originalFilename)) {
    throw new UploadValidationError("Invalid file name");
  }

  if (!isUploadExtensionAllowed(originalFilename, mimeType)) {
    throw new UploadValidationError("File extension does not match file type");
  }

  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new UploadValidationError("Invalid file size");
  }

  if (input.data.byteLength !== input.sizeBytes) {
    throw new UploadValidationError("Invalid file size");
  }

  if (input.sizeBytes > maxSizeBytes) {
    throw new UploadValidationError("File exceeds maximum size");
  }

  if (!hasExpectedFileSignature(input.data, mimeType)) {
    throw new UploadValidationError("File content does not match file type");
  }

  return mimeType;
}

export async function uploadSubmissionFile(
  user: RbacUser,
  submissionId: string,
  input: SubmissionUploadInput,
  options?: SubmissionUploadOptions
): Promise<SubmissionUploadResult> {
  const db = options?.database ?? getDatabase();
  const submission = await getUploadableSubmission(db, submissionId, user);

  if (!submission) {
    throw new SubmissionNotFoundError();
  }

  if (!canUploadToSubmission(user, submission)) {
    throw new AuthorizationError("Upload access denied");
  }

  const maxSizeBytes = await getTenantMaxUploadSizeBytes(db, submission.tenantId);
  const mimeType = validateSubmissionUploadInput(input, maxSizeBytes);
  const originalFilename = normalizeUploadFilename(input.originalFilename);
  const checksumSha256 = createHash("sha256").update(input.data).digest("hex");
  const storageKey = buildTenantStorageKey(
    submission.tenantId,
    submission.id,
    `${randomUUID()}-${originalFilename}`
  );
  const storage = getObjectStorageConfig();

  await putObject(
    {
      body: input.data,
      contentType: mimeType,
      key: storageKey,
      metadata: {
        checksumSha256,
        submissionId: submission.id,
        tenantId: submission.tenantId,
        uploadedByUserId: user.id
      }
    },
    options?.storageClient
  );

  return db.transaction(async (tx) => {
    const [storedFile] = await tx
      .insert(schema.submissionFiles)
      .values({
        checksumSha256,
        fileSizeBytes: input.sizeBytes,
        mimeType,
        originalFilename,
        storageBucket: storage.bucket,
        storageKey,
        submissionId: submission.id,
        tenantId: submission.tenantId,
        uploadedByUserId: user.id
      })
      .returning({
        checksumSha256: schema.submissionFiles.checksumSha256,
        fileSizeBytes: schema.submissionFiles.fileSizeBytes,
        id: schema.submissionFiles.id,
        mimeType: schema.submissionFiles.mimeType,
        originalFilename: schema.submissionFiles.originalFilename,
        storageBucket: schema.submissionFiles.storageBucket,
        storageKey: schema.submissionFiles.storageKey,
        submissionId: schema.submissionFiles.submissionId,
        tenantId: schema.submissionFiles.tenantId,
        uploadedByUserId: schema.submissionFiles.uploadedByUserId
      });

    const [updatedSubmission] = await tx
      .update(schema.submissions)
      .set({
        status: "UPLOADED",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, submission.id),
          eq(schema.submissions.tenantId, submission.tenantId),
          inArray(schema.submissions.status, [...uploadAllowedStatuses])
        )
      )
      .returning({
        id: schema.submissions.id,
        status: schema.submissions.status
      });

    if (!updatedSubmission) {
      throw new SubmissionUploadStateError();
    }

    await tx.insert(schema.auditEvents).values({
      action: "submission.file.upload",
      actorUserId: user.id,
      entityId: storedFile.id,
      entityType: "submission_file",
      metadata: {
        checksumSha256,
        fileSizeBytes: input.sizeBytes,
        mimeType,
        originalFilename,
        storageKey,
        submissionId: submission.id
      },
      tenantId: submission.tenantId
    });

    return {
      file: storedFile,
      submission: updatedSubmission
    };
  });
}

export function normalizeUploadFilename(filename: string): string {
  return filename.trim();
}

export function isUploadExtensionAllowed(
  filename: string,
  mimeType: SupportedUploadMimeType
): boolean {
  const extension = getFileExtension(filename);

  if (!extension) {
    return false;
  }

  return (uploadExtensionsByMimeType[mimeType] as readonly string[]).includes(
    extension
  );
}

export function hasExpectedFileSignature(
  data: Buffer,
  mimeType: SupportedUploadMimeType
): boolean {
  if (mimeType === "application/pdf") {
    return data.subarray(0, 5).equals(Buffer.from("%PDF-"));
  }

  if (mimeType === "application/msword") {
    return data.subarray(0, oleCompoundFileSignature.length).equals(
      oleCompoundFileSignature
    );
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
      data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x05, 0x06])) ||
      data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x07, 0x08]))
    );
  }

  return !data.includes(0);
}

function isSafeUploadFilename(filename: string): boolean {
  return (
    filename.length > 0 &&
    filename.length <= 255 &&
    !/[\\/]/.test(filename) &&
    !/[\u0000-\u001f\u007f]/.test(filename)
  );
}

function getFileExtension(filename: string): string | null {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return null;
  }

  return filename.slice(lastDotIndex).toLowerCase();
}

async function getUploadableSubmission(
  db: Database,
  submissionId: string,
  user: RbacUser
): Promise<UploadableSubmission | null> {
  const conditions: SQL[] = [eq(schema.submissions.id, submissionId)];

  if (user.role !== "SUPER_ADMIN") {
    if (!user.tenantId) {
      return null;
    }

    conditions.push(eq(schema.submissions.tenantId, user.tenantId));
  }

  const [submission] = await db
    .select({
      createdByUserId: schema.submissions.createdByUserId,
      id: schema.submissions.id,
      status: schema.submissions.status,
      tenantId: schema.submissions.tenantId
    })
    .from(schema.submissions)
    .where(and(...conditions))
    .limit(1);

  return submission ?? null;
}

async function getTenantMaxUploadSizeBytes(
  db: Database,
  tenantId: string
): Promise<number> {
  const [settingsRow] = await db
    .select({
      settings: schema.tenantSettings.settings
    })
    .from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenantId))
    .limit(1);

  return resolveMaxUploadSizeBytes(settingsRow?.settings);
}
