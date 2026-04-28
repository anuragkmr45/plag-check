import { and, desc, eq, type SQL } from "drizzle-orm";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";
import { getDatabase, schema, type Database } from "../../lib/db";
import type { TenantSettings } from "../../features/tenants/tenant-settings.service";

export type SubmissionStatus = (typeof schema.submissionStatus.enumValues)[number];

export type SubmissionSummary = {
  assignedReviewerId: string | null;
  createdAt: Date;
  createdByUserId: string;
  id: string;
  metadata: unknown;
  repositoryReuseConsentAt: Date | null;
  repositoryReuseConsentBy: string | null;
  status: SubmissionStatus;
  tenantId: string;
  title: string;
  updatedAt: Date;
  wordCount: number | null;
};

export type SubmissionFileSummary = {
  checksumSha256: string;
  createdAt: Date;
  fileSizeBytes: number;
  id: string;
  mimeType: string;
  originalFilename: string;
  storageBucket: string;
  storageKey: string;
  submissionId: string;
  uploadedByUserId: string;
};

export type SubmissionDetail = {
  files: SubmissionFileSummary[];
  submission: SubmissionSummary;
};

export type SubmissionScope = {
  createdByUserId?: string;
  isGlobal: boolean;
  tenantId?: string;
};

type SubmissionServiceOptions = {
  database?: Database;
};

type ListSubmissionsOptions = {
  tenantId?: string;
};

type CreateSubmissionInput = {
  tenantId?: string;
  title: string;
};

export type RepositoryReusePolicy = Pick<
  TenantSettings,
  "allowRepositoryReuse" | "requireUserConsentForRepository"
>;

export type RepositoryReuseConsentMetadata = Pick<
  SubmissionSummary,
  "repositoryReuseConsentAt" | "repositoryReuseConsentBy"
>;

function getSubmissionDatabase(options?: SubmissionServiceOptions): Database {
  return options?.database ?? getDatabase();
}

export function getSubmissionScope(
  user: RbacUser,
  options: ListSubmissionsOptions = {}
): SubmissionScope {
  if (user.role === "SUPER_ADMIN") {
    return options.tenantId
      ? {
          isGlobal: false,
          tenantId: options.tenantId
        }
      : {
          isGlobal: true
        };
  }

  if (!user.tenantId) {
    throw new AuthorizationError("Tenant access denied");
  }

  if (user.role === "USER") {
    return {
      createdByUserId: user.id,
      isGlobal: false,
      tenantId: user.tenantId
    };
  }

  return {
    isGlobal: false,
    tenantId: user.tenantId
  };
}

export function getSubmissionCreateTenantId(
  user: RbacUser,
  inputTenantId?: string
): string {
  if (user.role === "SUPER_ADMIN") {
    if (!inputTenantId) {
      throw new AuthorizationError("Tenant is required");
    }

    return inputTenantId;
  }

  if (!user.tenantId) {
    throw new AuthorizationError("Tenant access denied");
  }

  return user.tenantId;
}

export function hasRepositoryReuseConsent(
  submission: RepositoryReuseConsentMetadata
): boolean {
  return (
    submission.repositoryReuseConsentAt instanceof Date &&
    Boolean(submission.repositoryReuseConsentBy)
  );
}

export function canUseSubmissionForRepository(
  policy: RepositoryReusePolicy,
  submission: RepositoryReuseConsentMetadata
): boolean {
  if (!policy.allowRepositoryReuse || !policy.requireUserConsentForRepository) {
    return false;
  }

  return hasRepositoryReuseConsent(submission);
}

export async function listSubmissions(
  user: RbacUser,
  options?: ListSubmissionsOptions & SubmissionServiceOptions
): Promise<SubmissionSummary[]> {
  const db = getSubmissionDatabase(options);
  const scope = getSubmissionScope(user, options);
  const conditions = scopeToConditions(scope);

  return db
    .select(submissionSelect)
    .from(schema.submissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.submissions.createdAt));
}

export async function getSubmissionById(
  user: RbacUser,
  submissionId: string,
  options?: SubmissionServiceOptions
): Promise<SubmissionSummary | null> {
  const db = getSubmissionDatabase(options);
  const scope = getSubmissionScope(user);
  const conditions = [eq(schema.submissions.id, submissionId), ...scopeToConditions(scope)];
  const [submission] = await db
    .select(submissionSelect)
    .from(schema.submissions)
    .where(and(...conditions))
    .limit(1);

  return submission ?? null;
}

export async function getSubmissionDetailById(
  user: RbacUser,
  submissionId: string,
  options?: SubmissionServiceOptions
): Promise<SubmissionDetail | null> {
  const db = getSubmissionDatabase(options);
  const submission = await getSubmissionById(user, submissionId, {
    database: db
  });

  if (!submission) {
    return null;
  }

  const files = await db
    .select(submissionFileSelect)
    .from(schema.submissionFiles)
    .where(
      and(
        eq(schema.submissionFiles.tenantId, submission.tenantId),
        eq(schema.submissionFiles.submissionId, submission.id)
      )
    )
    .orderBy(desc(schema.submissionFiles.createdAt));

  return {
    files,
    submission
  };
}

export async function createSubmission(
  user: RbacUser,
  input: CreateSubmissionInput,
  options?: SubmissionServiceOptions
): Promise<SubmissionSummary> {
  const db = getSubmissionDatabase(options);
  const tenantId = getSubmissionCreateTenantId(user, input.tenantId);
  const [submission] = await db
    .insert(schema.submissions)
    .values({
      createdByUserId: user.id,
      metadata: {},
      tenantId,
      title: input.title
    })
    .returning(submissionSelect);

  await db.insert(schema.auditEvents).values({
    action: "submission.create",
    actorUserId: user.id,
    entityId: submission.id,
    entityType: "submission",
    metadata: {
      title: submission.title
    },
    tenantId
  });

  return submission;
}

const submissionSelect = {
  assignedReviewerId: schema.submissions.assignedReviewerId,
  createdAt: schema.submissions.createdAt,
  createdByUserId: schema.submissions.createdByUserId,
  id: schema.submissions.id,
  metadata: schema.submissions.metadata,
  repositoryReuseConsentAt: schema.submissions.repositoryReuseConsentAt,
  repositoryReuseConsentBy: schema.submissions.repositoryReuseConsentBy,
  status: schema.submissions.status,
  tenantId: schema.submissions.tenantId,
  title: schema.submissions.title,
  updatedAt: schema.submissions.updatedAt,
  wordCount: schema.submissions.wordCount
};

const submissionFileSelect = {
  checksumSha256: schema.submissionFiles.checksumSha256,
  createdAt: schema.submissionFiles.createdAt,
  fileSizeBytes: schema.submissionFiles.fileSizeBytes,
  id: schema.submissionFiles.id,
  mimeType: schema.submissionFiles.mimeType,
  originalFilename: schema.submissionFiles.originalFilename,
  storageBucket: schema.submissionFiles.storageBucket,
  storageKey: schema.submissionFiles.storageKey,
  submissionId: schema.submissionFiles.submissionId,
  uploadedByUserId: schema.submissionFiles.uploadedByUserId
};

function scopeToConditions(scope: SubmissionScope): SQL[] {
  const conditions: SQL[] = [];

  if (scope.tenantId) {
    conditions.push(eq(schema.submissions.tenantId, scope.tenantId));
  }

  if (scope.createdByUserId) {
    conditions.push(eq(schema.submissions.createdByUserId, scope.createdByUserId));
  }

  return conditions;
}
