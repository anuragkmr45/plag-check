import { eq, sql } from "drizzle-orm";
import {
  createExpiredSessionCookie,
  createSessionCookie,
  createSessionToken,
  getSessionExpiresAt,
  getSessionTokenFromCookieHeader,
  hashSessionToken,
  type SessionCookie
} from "../../lib/auth/session";
import { verifyPassword } from "../../lib/auth/password";
import { getDatabase, schema, type Database } from "../../lib/db";

type UserRole = (typeof schema.userRole.enumValues)[number];

export type AuthenticatedUser = {
  email: string;
  id: string;
  isActive: boolean;
  role: UserRole;
  tenantId: string | null;
};

export type AuthenticatedSession = {
  createdAt: Date;
  expiresAt: Date;
  id: string;
  userId: string;
};

export type CreatedSession = {
  cookie: SessionCookie;
  session: AuthenticatedSession;
  token: string;
};

export type ValidatedSession = {
  session: AuthenticatedSession;
  user: AuthenticatedUser;
};

type AuthServiceOptions = {
  audit?: {
    ip: string | null;
    userAgent: string | null;
  };
  database?: Database;
  now?: Date;
};

function getAuthDatabase(options?: AuthServiceOptions): Database {
  return options?.database ?? getDatabase();
}

function auditContext(options?: AuthServiceOptions): {
  ip: string | null;
  userAgent: string | null;
} {
  return {
    ip: options?.audit?.ip ?? null,
    userAgent: options?.audit?.userAgent ?? null
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
  options?: AuthServiceOptions
): Promise<(CreatedSession & { user: AuthenticatedUser }) | null> {
  const db = getAuthDatabase(options);
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const [user] = await db
    .select({
      email: schema.users.email,
      id: schema.users.id,
      isActive: schema.users.isActive,
      passwordHash: schema.users.passwordHash,
      role: schema.users.role,
      tenantId: schema.users.tenantId
    })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  const createdSession = await createSession(user.id, options);
  const { ip, userAgent } = auditContext(options);

  await db.insert(schema.auditEvents).values({
    action: "auth.login",
    actorUserId: user.id,
    entityId: user.id,
    entityType: "user",
    ip,
    metadata: {},
    tenantId: user.tenantId,
    userAgent
  });

  return {
    ...createdSession,
    user: {
      email: user.email,
      id: user.id,
      isActive: user.isActive,
      role: user.role,
      tenantId: user.tenantId
    }
  };
}

export async function createSession(
  userId: string,
  options?: AuthServiceOptions
): Promise<CreatedSession> {
  const db = getAuthDatabase(options);
  const now = options?.now ?? new Date();

  const [user] = await db
    .select({
      id: schema.users.id,
      isActive: schema.users.isActive,
      tenantId: schema.users.tenantId
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user || !user.isActive) {
    throw new Error("Cannot create session for missing or inactive user");
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt(now);
  const [session] = await db
    .insert(schema.sessions)
    .values({
      expiresAt,
      tokenHash,
      userId
    })
    .returning({
      createdAt: schema.sessions.createdAt,
      expiresAt: schema.sessions.expiresAt,
      id: schema.sessions.id,
      userId: schema.sessions.userId
    });

  await db.insert(schema.auditEvents).values({
    action: "session.create",
    actorUserId: user.id,
    entityId: session.id,
    entityType: "session",
    ip: auditContext(options).ip,
    metadata: {},
    tenantId: user.tenantId,
    userAgent: auditContext(options).userAgent
  });

  return {
    cookie: createSessionCookie(token, expiresAt),
    session,
    token
  };
}

export async function validateSession(
  sessionToken: string,
  options?: AuthServiceOptions
): Promise<ValidatedSession | null> {
  const db = getAuthDatabase(options);
  const now = options?.now ?? new Date();
  const tokenHash = hashSessionToken(sessionToken);

  const [record] = await db
    .select({
      sessionCreatedAt: schema.sessions.createdAt,
      sessionExpiresAt: schema.sessions.expiresAt,
      sessionId: schema.sessions.id,
      sessionUserId: schema.sessions.userId,
      userEmail: schema.users.email,
      userId: schema.users.id,
      userIsActive: schema.users.isActive,
      userRole: schema.users.role,
      userTenantId: schema.users.tenantId
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.tokenHash, tokenHash))
    .limit(1);

  if (!record) {
    return null;
  }

  if (!record.userIsActive || record.sessionExpiresAt <= now) {
    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, record.sessionId));

    return null;
  }

  return {
    session: {
      createdAt: record.sessionCreatedAt,
      expiresAt: record.sessionExpiresAt,
      id: record.sessionId,
      userId: record.sessionUserId
    },
    user: {
      email: record.userEmail,
      id: record.userId,
      isActive: record.userIsActive,
      role: record.userRole,
      tenantId: record.userTenantId
    }
  };
}

export async function destroySession(
  sessionToken: string,
  options?: AuthServiceOptions
): Promise<{ cookie: SessionCookie }> {
  const db = getAuthDatabase(options);
  const tokenHash = hashSessionToken(sessionToken);

  const [record] = await db
    .select({
      sessionId: schema.sessions.id,
      userId: schema.users.id,
      userTenantId: schema.users.tenantId
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.tokenHash, tokenHash))
    .limit(1);

  if (record) {
    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, record.sessionId));

    const { ip, userAgent } = auditContext(options);

    await db.insert(schema.auditEvents).values({
      action: "auth.logout",
      actorUserId: record.userId,
      entityId: record.sessionId,
      entityType: "session",
      ip,
      metadata: {},
      tenantId: record.userTenantId,
      userAgent
    });
  }

  return {
    cookie: createExpiredSessionCookie()
  };
}

export async function getCurrentUserFromRequest(
  request: Pick<Request, "headers">,
  options?: AuthServiceOptions
): Promise<ValidatedSession | null> {
  const sessionToken = getSessionTokenFromCookieHeader(
    request.headers.get("cookie")
  );

  if (!sessionToken) {
    return null;
  }

  return validateSession(sessionToken, options);
}
