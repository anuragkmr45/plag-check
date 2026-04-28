import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDatabase, schema, type Database } from "../../lib/db";
import { AuthorizationError, type RbacUser } from "../../lib/rbac/guards";

export const REQUIRED_AUDIT_ACTIONS = [
  "auth.login",
  "auth.logout",
  "user.create",
  "user.role.update",
  "user.activate",
  "user.deactivate",
  "submission.create",
  "submission.file.upload",
  "submission.extract",
  "submission.preprocess",
  "submission.scan.queued",
  "submission.scan.completed",
  "report.pdf.generated",
  "review_case.note_added",
  "review_case.status_changed",
  "tenant.settings.update",
  "support_ticket.status_changed"
] as const;

export type AuditLogFilters = {
  action?: string;
  actorUserId?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
};

export type AuditLogScope = {
  isGlobal: boolean;
  tenantId: string | null;
};

export type AuditEventListItem = {
  action: string;
  actorEmail: string | null;
  actorUserId: string | null;
  createdAt: Date;
  entityId: string | null;
  entityType: string;
  id: string;
  ip: string | null;
  metadata: unknown;
  tenantId: string | null;
  tenantName: string | null;
  userAgent: string | null;
};

export type AuditLogView = {
  actions: readonly string[];
  events: AuditEventListItem[];
  filters: AuditLogFilters;
  scope: AuditLogScope;
};

type AuditServiceOptions = {
  database?: Database;
};

const auditFiltersSchema = z
  .object({
    action: z.string().trim().max(160).optional(),
    actorUserId: z.string().uuid().optional(),
    entityType: z.string().trim().max(120).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
  .transform((filters) => ({
    action: emptyToUndefined(filters.action),
    actorUserId: filters.actorUserId,
    entityType: emptyToUndefined(filters.entityType),
    from: validDateOrUndefined(filters.from),
    to: validDateOrUndefined(filters.to)
  }));

export function resolveAuditScope(user: RbacUser): AuditLogScope {
  if (user.role === "SUPER_ADMIN") {
    return {
      isGlobal: true,
      tenantId: null
    };
  }

  if (user.role === "INSTITUTION_ADMIN" && user.tenantId) {
    return {
      isGlobal: false,
      tenantId: user.tenantId
    };
  }

  throw new AuthorizationError("Audit access denied");
}

export function parseAuditLogFilters(input: {
  action?: string | null;
  actorUserId?: string | null;
  entityType?: string | null;
  from?: string | null;
  to?: string | null;
}): AuditLogFilters {
  return auditFiltersSchema.parse({
    action: input.action || undefined,
    actorUserId: input.actorUserId || undefined,
    entityType: input.entityType || undefined,
    from: input.from || undefined,
    to: input.to || undefined
  });
}

export async function listAuditEvents(
  user: RbacUser,
  filters: AuditLogFilters = {},
  options: AuditServiceOptions = {}
): Promise<AuditLogView> {
  const db = options.database ?? getDatabase();
  const scope = resolveAuditScope(user);
  const conditions = getAuditConditions(scope, filters);

  const events = await db
    .select({
      action: schema.auditEvents.action,
      actorEmail: schema.users.email,
      actorUserId: schema.auditEvents.actorUserId,
      createdAt: schema.auditEvents.createdAt,
      entityId: schema.auditEvents.entityId,
      entityType: schema.auditEvents.entityType,
      id: schema.auditEvents.id,
      ip: schema.auditEvents.ip,
      metadata: schema.auditEvents.metadata,
      tenantId: schema.auditEvents.tenantId,
      tenantName: schema.tenants.name,
      userAgent: schema.auditEvents.userAgent
    })
    .from(schema.auditEvents)
    .leftJoin(schema.users, eq(schema.auditEvents.actorUserId, schema.users.id))
    .leftJoin(schema.tenants, eq(schema.auditEvents.tenantId, schema.tenants.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(100);

  return {
    actions: REQUIRED_AUDIT_ACTIONS,
    events,
    filters,
    scope
  };
}

function getAuditConditions(
  scope: AuditLogScope,
  filters: AuditLogFilters
): SQL[] {
  const conditions: SQL[] = [];

  if (scope.tenantId) {
    conditions.push(eq(schema.auditEvents.tenantId, scope.tenantId));
  }

  if (filters.action) {
    conditions.push(eq(schema.auditEvents.action, filters.action));
  }

  if (filters.entityType) {
    conditions.push(eq(schema.auditEvents.entityType, filters.entityType));
  }

  if (filters.actorUserId) {
    conditions.push(eq(schema.auditEvents.actorUserId, filters.actorUserId));
  }

  if (filters.from) {
    conditions.push(gte(schema.auditEvents.createdAt, filters.from));
  }

  if (filters.to) {
    conditions.push(lte(schema.auditEvents.createdAt, filters.to));
  }

  return conditions;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function validDateOrUndefined(value: Date | undefined): Date | undefined {
  return value && !Number.isNaN(value.getTime()) ? value : undefined;
}
