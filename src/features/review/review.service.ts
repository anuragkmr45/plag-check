import {
  and,
  desc,
  eq,
  isNull,
  or,
  sql,
  type SQL
} from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import type { RbacUser } from "../../lib/rbac/guards";
import type { SubmissionStatus } from "../../server/services/submissions.service";

export const REVIEW_CASE_STATUSES = [
  "OPEN",
  "HOLD",
  "CLEARED",
  "ESCALATED"
] as const;

export const REVIEW_ACTION_STATUSES = [
  "HOLD",
  "CLEARED",
  "ESCALATED"
] as const;

export type ReviewCaseStatus = (typeof REVIEW_CASE_STATUSES)[number];
export type ReviewActionStatus = (typeof REVIEW_ACTION_STATUSES)[number];

export type ReviewCaseSummary = {
  assignedReviewerEmail: string | null;
  assignedReviewerId: string | null;
  createdAt: Date;
  finalDecision: string | null;
  id: string;
  status: string;
  submission: {
    id: string;
    status: SubmissionStatus;
    title: string;
  };
  tenantId: string;
  updatedAt: Date;
};

export type ReviewCaseEvent = {
  actorUserId: string | null;
  comment: string | null;
  createdAt: Date;
  eventType: string;
  id: string;
  metadata: unknown;
};

export type ReviewCaseDetail = {
  events: ReviewCaseEvent[];
  reviewCase: ReviewCaseSummary;
};

type ReviewServiceOptions = {
  database?: Database;
};

const noteSchema = z.string().trim().min(1).max(2000);
const reviewStatusSet = new Set<string>(REVIEW_CASE_STATUSES);

export class ReviewCaseNotFoundError extends Error {
  readonly code = "REVIEW_CASE_NOT_FOUND";

  constructor(message = "Review case not found") {
    super(message);
    this.name = "ReviewCaseNotFoundError";
  }
}

export class ReviewCaseActionForbiddenError extends Error {
  readonly code = "REVIEW_CASE_ACTION_FORBIDDEN";

  constructor(message = "Review case action is not allowed") {
    super(message);
    this.name = "ReviewCaseActionForbiddenError";
  }
}

export class ReviewCaseStateError extends Error {
  readonly code = "REVIEW_CASE_STATE_ERROR";

  constructor(message = "Review case state transition is not allowed") {
    super(message);
    this.name = "ReviewCaseStateError";
  }
}

export class ReviewCaseValidationError extends Error {
  readonly code = "REVIEW_CASE_VALIDATION_ERROR";

  constructor(message = "Review case input is invalid") {
    super(message);
    this.name = "ReviewCaseValidationError";
  }
}

export async function listReviewCases(
  user: RbacUser,
  options: ReviewServiceOptions = {}
): Promise<ReviewCaseSummary[]> {
  const db = options.database ?? getDatabase();
  const conditions = getReviewCaseAccessConditions(user);

  return db
    .select(reviewCaseSelect)
    .from(schema.reviewCases)
    .innerJoin(
      schema.submissions,
      and(
        eq(schema.reviewCases.tenantId, schema.submissions.tenantId),
        eq(schema.reviewCases.submissionId, schema.submissions.id)
      )
    )
    .leftJoin(schema.users, eq(schema.reviewCases.assignedReviewerId, schema.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.reviewCases.updatedAt))
    .then((rows) => rows.map(mapReviewCaseRow));
}

export async function getReviewCaseDetail(
  user: RbacUser,
  reviewCaseId: string,
  options: ReviewServiceOptions = {}
): Promise<ReviewCaseDetail | null> {
  const db = options.database ?? getDatabase();
  const reviewCase = await getReviewCaseSummaryById(db, user, reviewCaseId);

  if (!reviewCase) {
    return null;
  }

  const events = await db
    .select({
      actorUserId: schema.reviewEvents.actorUserId,
      comment: schema.reviewEvents.comment,
      createdAt: schema.reviewEvents.createdAt,
      eventType: schema.reviewEvents.eventType,
      id: schema.reviewEvents.id,
      metadata: schema.reviewEvents.metadata
    })
    .from(schema.reviewEvents)
    .where(
      and(
        eq(schema.reviewEvents.tenantId, reviewCase.tenantId),
        eq(schema.reviewEvents.reviewCaseId, reviewCase.id)
      )
    )
    .orderBy(schema.reviewEvents.createdAt);

  return {
    events,
    reviewCase
  };
}

export async function assignReviewCaseToSelf(
  user: RbacUser,
  reviewCaseId: string,
  options: ReviewServiceOptions = {}
): Promise<ReviewCaseSummary> {
  const db = options.database ?? getDatabase();

  return db.transaction(async (tx) => {
    const detail = await getReviewCaseDetail(user, reviewCaseId, {
      database: tx
    });

    if (!detail) {
      throw new ReviewCaseNotFoundError();
    }

    if (!canAssignReviewCaseToSelf(user, detail.reviewCase)) {
      throw new ReviewCaseActionForbiddenError("Only an unassigned open case can be self-assigned by a tenant reviewer");
    }

    const [updated] = await tx
      .update(schema.reviewCases)
      .set({
        assignedReviewerId: user.id,
        status: "OPEN",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.reviewCases.id, detail.reviewCase.id),
          eq(schema.reviewCases.tenantId, detail.reviewCase.tenantId),
          isNull(schema.reviewCases.assignedReviewerId),
          eq(schema.reviewCases.status, "OPEN")
        )
      )
      .returning({
        id: schema.reviewCases.id
      });

    if (!updated) {
      throw new ReviewCaseStateError("Review case is no longer available for self-assignment");
    }

    await tx
      .update(schema.submissions)
      .set({
        assignedReviewerId: user.id,
        status: "UNDER_REVIEW",
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, detail.reviewCase.submission.id),
          eq(schema.submissions.tenantId, detail.reviewCase.tenantId)
        )
      );

    await writeReviewEvent(tx, {
      actorUserId: user.id,
      eventType: "ASSIGNED_SELF",
      metadata: {
        assignedReviewerId: user.id
      },
      reviewCaseId: detail.reviewCase.id,
      tenantId: detail.reviewCase.tenantId
    });

    await writeAuditEvent(tx, user, detail.reviewCase, "review_case.assign_self", {
      assignedReviewerId: user.id
    });

    const refreshed = await getReviewCaseSummaryById(tx, user, reviewCaseId);

    if (!refreshed) {
      throw new ReviewCaseNotFoundError();
    }

    return refreshed;
  });
}

export async function addReviewCaseNote(
  user: RbacUser,
  reviewCaseId: string,
  comment: string,
  options: ReviewServiceOptions = {}
): Promise<void> {
  const parsedComment = noteSchema.safeParse(comment);

  if (!parsedComment.success) {
    throw new ReviewCaseValidationError("Review note must be between 1 and 2000 characters");
  }

  const db = options.database ?? getDatabase();

  await db.transaction(async (tx) => {
    const detail = await getReviewCaseDetail(user, reviewCaseId, {
      database: tx
    });

    if (!detail) {
      throw new ReviewCaseNotFoundError();
    }

    if (!canModifyReviewCase(user, detail.reviewCase)) {
      throw new ReviewCaseActionForbiddenError("Review note is not allowed for this case");
    }

    await writeReviewEvent(tx, {
      actorUserId: user.id,
      comment: parsedComment.data,
      eventType: "NOTE_ADDED",
      metadata: {},
      reviewCaseId: detail.reviewCase.id,
      tenantId: detail.reviewCase.tenantId
    });

    await tx
      .update(schema.reviewCases)
      .set({
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.reviewCases.id, detail.reviewCase.id),
          eq(schema.reviewCases.tenantId, detail.reviewCase.tenantId)
        )
      );

    await writeAuditEvent(tx, user, detail.reviewCase, "review_case.note_added", {
      commentLength: parsedComment.data.length
    });
  });
}

export async function setReviewCaseStatus(
  user: RbacUser,
  reviewCaseId: string,
  nextStatus: ReviewActionStatus,
  options: ReviewServiceOptions = {}
): Promise<void> {
  const db = options.database ?? getDatabase();

  await db.transaction(async (tx) => {
    const detail = await getReviewCaseDetail(user, reviewCaseId, {
      database: tx
    });

    if (!detail) {
      throw new ReviewCaseNotFoundError();
    }

    if (!canModifyReviewCase(user, detail.reviewCase)) {
      throw new ReviewCaseActionForbiddenError("Status change is not allowed for this case");
    }

    if (!isAllowedReviewStatusTransition(detail.reviewCase.status, nextStatus)) {
      throw new ReviewCaseStateError();
    }

    await tx
      .update(schema.reviewCases)
      .set({
        status: nextStatus,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.reviewCases.id, detail.reviewCase.id),
          eq(schema.reviewCases.tenantId, detail.reviewCase.tenantId)
        )
      );

    await tx
      .update(schema.submissions)
      .set({
        status: nextStatus,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.submissions.id, detail.reviewCase.submission.id),
          eq(schema.submissions.tenantId, detail.reviewCase.tenantId)
        )
      );

    await writeReviewEvent(tx, {
      actorUserId: user.id,
      eventType: "STATUS_CHANGED",
      metadata: {
        from: detail.reviewCase.status,
        to: nextStatus
      },
      reviewCaseId: detail.reviewCase.id,
      tenantId: detail.reviewCase.tenantId
    });

    await writeAuditEvent(tx, user, detail.reviewCase, "review_case.status_changed", {
      from: detail.reviewCase.status,
      to: nextStatus
    });
  });
}

export function isAllowedReviewStatusTransition(
  currentStatus: string,
  nextStatus: ReviewActionStatus
): boolean {
  if (!reviewStatusSet.has(currentStatus) || currentStatus === nextStatus) {
    return false;
  }

  if (currentStatus === "CLEARED" || currentStatus === "ESCALATED") {
    return false;
  }

  return REVIEW_ACTION_STATUSES.includes(nextStatus);
}

export function canAssignReviewCaseToSelf(
  user: RbacUser,
  reviewCase: Pick<ReviewCaseSummary, "assignedReviewerId" | "status" | "tenantId">
): boolean {
  return (
    user.role === "REVIEWER" &&
    Boolean(user.tenantId) &&
    user.tenantId === reviewCase.tenantId &&
    reviewCase.assignedReviewerId === null &&
    reviewCase.status === "OPEN"
  );
}

export function canModifyReviewCase(
  user: RbacUser,
  reviewCase: Pick<ReviewCaseSummary, "assignedReviewerId" | "tenantId">
): boolean {
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  if (!user.tenantId || user.tenantId !== reviewCase.tenantId) {
    return false;
  }

  if (user.role === "INSTITUTION_ADMIN") {
    return true;
  }

  return user.role === "REVIEWER" && reviewCase.assignedReviewerId === user.id;
}

function getReviewCaseAccessConditions(user: RbacUser): SQL[] {
  if (user.role === "SUPER_ADMIN") {
    return [];
  }

  if (!user.tenantId) {
    return [sql`false`];
  }

  const conditions: SQL[] = [eq(schema.reviewCases.tenantId, user.tenantId)];

  if (user.role === "REVIEWER") {
    conditions.push(
      or(
        isNull(schema.reviewCases.assignedReviewerId),
        eq(schema.reviewCases.assignedReviewerId, user.id)
      ) ?? sql`false`
    );
  } else if (user.role !== "INSTITUTION_ADMIN") {
    conditions.push(sql`false`);
  }

  return conditions;
}

async function getReviewCaseSummaryById(
  db: Database,
  user: RbacUser,
  reviewCaseId: string
): Promise<ReviewCaseSummary | null> {
  const conditions = [
    eq(schema.reviewCases.id, reviewCaseId),
    ...getReviewCaseAccessConditions(user)
  ];

  const [row] = await db
    .select(reviewCaseSelect)
    .from(schema.reviewCases)
    .innerJoin(
      schema.submissions,
      and(
        eq(schema.reviewCases.tenantId, schema.submissions.tenantId),
        eq(schema.reviewCases.submissionId, schema.submissions.id)
      )
    )
    .leftJoin(schema.users, eq(schema.reviewCases.assignedReviewerId, schema.users.id))
    .where(and(...conditions))
    .limit(1);

  return row ? mapReviewCaseRow(row) : null;
}

const reviewCaseSelect = {
  assignedReviewerEmail: schema.users.email,
  assignedReviewerId: schema.reviewCases.assignedReviewerId,
  createdAt: schema.reviewCases.createdAt,
  finalDecision: schema.reviewCases.finalDecision,
  id: schema.reviewCases.id,
  status: schema.reviewCases.status,
  submissionId: schema.submissions.id,
  submissionStatus: schema.submissions.status,
  submissionTitle: schema.submissions.title,
  tenantId: schema.reviewCases.tenantId,
  updatedAt: schema.reviewCases.updatedAt
};

type ReviewCaseRow = {
  assignedReviewerEmail: string | null;
  assignedReviewerId: string | null;
  createdAt: Date;
  finalDecision: string | null;
  id: string;
  status: string;
  submissionId: string;
  submissionStatus: SubmissionStatus;
  submissionTitle: string;
  tenantId: string;
  updatedAt: Date;
};

function mapReviewCaseRow(row: ReviewCaseRow): ReviewCaseSummary {
  return {
    assignedReviewerEmail: row.assignedReviewerEmail,
    assignedReviewerId: row.assignedReviewerId,
    createdAt: row.createdAt,
    finalDecision: row.finalDecision,
    id: row.id,
    status: row.status,
    submission: {
      id: row.submissionId,
      status: row.submissionStatus,
      title: row.submissionTitle
    },
    tenantId: row.tenantId,
    updatedAt: row.updatedAt
  };
}

async function writeReviewEvent(
  db: Database,
  input: {
    actorUserId: string | null;
    comment?: string;
    eventType: string;
    metadata: Record<string, unknown>;
    reviewCaseId: string;
    tenantId: string;
  }
): Promise<void> {
  await db.insert(schema.reviewEvents).values({
    actorUserId: input.actorUserId,
    comment: input.comment,
    eventType: input.eventType,
    metadata: input.metadata,
    reviewCaseId: input.reviewCaseId,
    tenantId: input.tenantId
  });
}

async function writeAuditEvent(
  db: Database,
  user: RbacUser,
  reviewCase: ReviewCaseSummary,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await db.insert(schema.auditEvents).values({
    action,
    actorUserId: user.id,
    entityId: reviewCase.id,
    entityType: "review_case",
    metadata: {
      ...metadata,
      submissionId: reviewCase.submission.id
    },
    tenantId: reviewCase.tenantId
  });
}
