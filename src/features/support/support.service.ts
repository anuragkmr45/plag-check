import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export type SupportTicketSummary = {
  createdAt: Date;
  createdByEmail: string;
  createdByUserId: string;
  description: string;
  id: string;
  status: SupportTicketStatus;
  tenantId: string;
  tenantName: string;
  title: string;
  updatedAt: Date;
};

export type SupportTicketComment = {
  authorEmail: string;
  authorUserId: string;
  body: string;
  createdAt: Date;
  id: string;
};

export type SupportTicketDetail = {
  comments: SupportTicketComment[];
  ticket: SupportTicketSummary;
};

export type CreateSupportTicketInput = {
  description: string;
  title: string;
};

export type AddSupportTicketCommentInput = {
  body: string;
  ticketId: string;
};

export type SetSupportTicketStatusInput = {
  status: SupportTicketStatus;
  ticketId: string;
};

type SupportServiceOptions = {
  database?: Database;
};

type SupportTicketAccessTarget = Pick<
  SupportTicketSummary,
  "createdByUserId" | "tenantId"
>;

const ticketIdSchema = z.string().uuid();
const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUSES);
const createSupportTicketInputSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  title: z.string().trim().min(3).max(200)
});
const addSupportTicketCommentInputSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  ticketId: ticketIdSchema
});
const setSupportTicketStatusInputSchema = z.object({
  status: supportTicketStatusSchema,
  ticketId: ticketIdSchema
});

export class SupportTicketNotFoundError extends Error {
  readonly code = "SUPPORT_TICKET_NOT_FOUND";

  constructor(message = "Support ticket not found") {
    super(message);
    this.name = "SupportTicketNotFoundError";
  }
}

export class SupportTicketValidationError extends Error {
  readonly code = "SUPPORT_TICKET_VALIDATION_ERROR";

  constructor(message = "Support ticket input is invalid") {
    super(message);
    this.name = "SupportTicketValidationError";
  }
}

export class SupportTicketStateError extends Error {
  readonly code = "SUPPORT_TICKET_STATE_ERROR";

  constructor(message = "Support ticket status transition is not allowed") {
    super(message);
    this.name = "SupportTicketStateError";
  }
}

export function parseCreateSupportTicketFormData(
  formData: FormData
): CreateSupportTicketInput {
  return createSupportTicketInputSchema.parse({
    description: stringField(formData, "description"),
    title: stringField(formData, "title")
  });
}

export function parseAddSupportTicketCommentFormData(
  formData: FormData
): AddSupportTicketCommentInput {
  return addSupportTicketCommentInputSchema.parse({
    body: stringField(formData, "body"),
    ticketId: stringField(formData, "ticketId")
  });
}

export function parseSetSupportTicketStatusFormData(
  formData: FormData
): SetSupportTicketStatusInput {
  return setSupportTicketStatusInputSchema.parse({
    status: stringField(formData, "status"),
    ticketId: stringField(formData, "ticketId")
  });
}

export function canCreateSupportTicket(user: RbacUser): boolean {
  return Boolean(user.tenantId);
}

export function canViewSupportTicket(
  user: RbacUser,
  ticket: SupportTicketAccessTarget
): boolean {
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  if (!user.tenantId || user.tenantId !== ticket.tenantId) {
    return false;
  }

  if (user.role === "INSTITUTION_ADMIN") {
    return true;
  }

  return ticket.createdByUserId === user.id;
}

export function canUpdateSupportTicketStatus(
  user: RbacUser,
  ticket: Pick<SupportTicketSummary, "tenantId">
): boolean {
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  return (
    user.role === "INSTITUTION_ADMIN" &&
    Boolean(user.tenantId) &&
    user.tenantId === ticket.tenantId
  );
}

export function isAllowedSupportTicketStatusTransition(
  currentStatus: SupportTicketStatus,
  nextStatus: SupportTicketStatus
): boolean {
  return currentStatus !== nextStatus;
}

export async function listSupportTickets(
  user: RbacUser,
  options: SupportServiceOptions = {}
): Promise<SupportTicketSummary[]> {
  const db = options.database ?? getDatabase();
  const conditions = getSupportTicketAccessConditions(user);

  return db
    .select(supportTicketSelect)
    .from(schema.supportTickets)
    .innerJoin(schema.tenants, eq(schema.supportTickets.tenantId, schema.tenants.id))
    .innerJoin(
      schema.users,
      eq(schema.supportTickets.createdByUserId, schema.users.id)
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.supportTickets.updatedAt))
    .then((rows) => rows.map(mapSupportTicketRow));
}

export async function getSupportTicketDetail(
  user: RbacUser,
  ticketId: string,
  options: SupportServiceOptions = {}
): Promise<SupportTicketDetail | null> {
  const parsedTicketId = ticketIdSchema.safeParse(ticketId);

  if (!parsedTicketId.success) {
    return null;
  }

  const db = options.database ?? getDatabase();
  const ticket = await getSupportTicketSummaryById(db, user, parsedTicketId.data);

  if (!ticket) {
    return null;
  }

  const comments = await db
    .select({
      authorEmail: schema.users.email,
      authorUserId: schema.supportTicketComments.authorUserId,
      body: schema.supportTicketComments.body,
      createdAt: schema.supportTicketComments.createdAt,
      id: schema.supportTicketComments.id
    })
    .from(schema.supportTicketComments)
    .innerJoin(
      schema.users,
      eq(schema.supportTicketComments.authorUserId, schema.users.id)
    )
    .where(
      and(
        eq(schema.supportTicketComments.tenantId, ticket.tenantId),
        eq(schema.supportTicketComments.ticketId, ticket.id)
      )
    )
    .orderBy(schema.supportTicketComments.createdAt);

  return {
    comments,
    ticket
  };
}

export async function createSupportTicket(
  user: RbacUser,
  input: CreateSupportTicketInput,
  options: SupportServiceOptions = {}
): Promise<SupportTicketSummary> {
  const normalizedInput = createSupportTicketInputSchema.parse(input);

  if (!user.tenantId) {
    throw new AuthorizationError("Support ticket creation requires a tenant");
  }

  const db = options.database ?? getDatabase();
  const tenantId = user.tenantId;

  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .insert(schema.supportTickets)
      .values({
        createdByUserId: user.id,
        description: normalizedInput.description,
        tenantId,
        title: normalizedInput.title
      })
      .returning({
        id: schema.supportTickets.id
      });

    if (!ticket) {
      throw new SupportTicketValidationError("Support ticket could not be created");
    }

    await tx.insert(schema.auditEvents).values({
      action: "support_ticket.create",
      actorUserId: user.id,
      entityId: ticket.id,
      entityType: "support_ticket",
      metadata: {
        title: normalizedInput.title
      },
      tenantId
    });

    const createdTicket = await getSupportTicketSummaryById(tx, user, ticket.id);

    if (!createdTicket) {
      throw new SupportTicketNotFoundError();
    }

    return createdTicket;
  });
}

export async function addSupportTicketComment(
  user: RbacUser,
  input: AddSupportTicketCommentInput,
  options: SupportServiceOptions = {}
): Promise<void> {
  const normalizedInput = addSupportTicketCommentInputSchema.parse(input);
  const db = options.database ?? getDatabase();

  await db.transaction(async (tx) => {
    const ticket = await getSupportTicketSummaryById(
      tx,
      user,
      normalizedInput.ticketId
    );

    if (!ticket) {
      throw new SupportTicketNotFoundError();
    }

    await tx.insert(schema.supportTicketComments).values({
      authorUserId: user.id,
      body: normalizedInput.body,
      tenantId: ticket.tenantId,
      ticketId: ticket.id
    });

    await tx
      .update(schema.supportTickets)
      .set({
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.supportTickets.id, ticket.id),
          eq(schema.supportTickets.tenantId, ticket.tenantId)
        )
      );

    await tx.insert(schema.auditEvents).values({
      action: "support_ticket.comment_added",
      actorUserId: user.id,
      entityId: ticket.id,
      entityType: "support_ticket",
      metadata: {
        bodyLength: normalizedInput.body.length
      },
      tenantId: ticket.tenantId
    });
  });
}

export async function setSupportTicketStatus(
  user: RbacUser,
  input: SetSupportTicketStatusInput,
  options: SupportServiceOptions = {}
): Promise<void> {
  const normalizedInput = setSupportTicketStatusInputSchema.parse(input);
  const db = options.database ?? getDatabase();

  await db.transaction(async (tx) => {
    const ticket = await getSupportTicketSummaryById(
      tx,
      user,
      normalizedInput.ticketId
    );

    if (!ticket) {
      throw new SupportTicketNotFoundError();
    }

    if (!canUpdateSupportTicketStatus(user, ticket)) {
      throw new AuthorizationError("Support ticket status update denied");
    }

    if (
      !isAllowedSupportTicketStatusTransition(ticket.status, normalizedInput.status)
    ) {
      throw new SupportTicketStateError();
    }

    await tx
      .update(schema.supportTickets)
      .set({
        status: normalizedInput.status,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(schema.supportTickets.id, ticket.id),
          eq(schema.supportTickets.tenantId, ticket.tenantId)
        )
      );

    await tx.insert(schema.auditEvents).values({
      action: "support_ticket.status_changed",
      actorUserId: user.id,
      entityId: ticket.id,
      entityType: "support_ticket",
      metadata: {
        from: ticket.status,
        to: normalizedInput.status
      },
      tenantId: ticket.tenantId
    });
  });
}

function getSupportTicketAccessConditions(user: RbacUser): SQL[] {
  if (user.role === "SUPER_ADMIN") {
    return [];
  }

  if (!user.tenantId) {
    return [sql`false`];
  }

  const conditions: SQL[] = [eq(schema.supportTickets.tenantId, user.tenantId)];

  if (user.role !== "INSTITUTION_ADMIN") {
    conditions.push(eq(schema.supportTickets.createdByUserId, user.id));
  }

  return conditions;
}

async function getSupportTicketSummaryById(
  db: Database,
  user: RbacUser,
  ticketId: string
): Promise<SupportTicketSummary | null> {
  const conditions = [
    eq(schema.supportTickets.id, ticketId),
    ...getSupportTicketAccessConditions(user)
  ];

  const [row] = await db
    .select(supportTicketSelect)
    .from(schema.supportTickets)
    .innerJoin(schema.tenants, eq(schema.supportTickets.tenantId, schema.tenants.id))
    .innerJoin(
      schema.users,
      eq(schema.supportTickets.createdByUserId, schema.users.id)
    )
    .where(and(...conditions))
    .limit(1);

  return row ? mapSupportTicketRow(row) : null;
}

const supportTicketSelect = {
  createdAt: schema.supportTickets.createdAt,
  createdByEmail: schema.users.email,
  createdByUserId: schema.supportTickets.createdByUserId,
  description: schema.supportTickets.description,
  id: schema.supportTickets.id,
  status: schema.supportTickets.status,
  tenantId: schema.supportTickets.tenantId,
  tenantName: schema.tenants.name,
  title: schema.supportTickets.title,
  updatedAt: schema.supportTickets.updatedAt
};

type SupportTicketRow = {
  createdAt: Date;
  createdByEmail: string;
  createdByUserId: string;
  description: string;
  id: string;
  status: SupportTicketStatus;
  tenantId: string;
  tenantName: string;
  title: string;
  updatedAt: Date;
};

function mapSupportTicketRow(row: SupportTicketRow): SupportTicketSummary {
  return row;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}
