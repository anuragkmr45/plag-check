import type {
  AuthenticatedUser,
  ValidatedSession
} from "../../server/services/auth.service";
import { getCurrentUserFromRequest } from "../../server/services/auth.service";
import type { UserRole } from "./roles";

export type RbacUser = Pick<
  AuthenticatedUser,
  "id" | "isActive" | "role" | "tenantId"
>;

export class AuthenticationRequiredError extends Error {
  readonly code = "AUTHENTICATION_REQUIRED";
  readonly status = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

type CurrentUserResolver = (
  request: Pick<Request, "headers">
) => Promise<ValidatedSession | null>;

export function hasRole(
  user: Pick<RbacUser, "role"> | null | undefined,
  roles: readonly UserRole[]
): boolean {
  return Boolean(user && roles.includes(user.role));
}

export async function requireAuth(
  request: Pick<Request, "headers">,
  options?: {
    getCurrentUser?: CurrentUserResolver;
  }
): Promise<ValidatedSession> {
  const result = await (options?.getCurrentUser ?? getCurrentUserFromRequest)(
    request
  );

  if (!result) {
    throw new AuthenticationRequiredError();
  }

  return result;
}

export function requireRole(
  roles: readonly UserRole[]
): (user: RbacUser) => RbacUser {
  return (user) => {
    if (!hasRole(user, roles)) {
      throw new AuthorizationError();
    }

    return user;
  };
}

export function assertSameTenant(
  user: RbacUser,
  tenantId: string | null
): void {
  if (user.role === "SUPER_ADMIN") {
    return;
  }

  if (!tenantId || !user.tenantId || user.tenantId !== tenantId) {
    throw new AuthorizationError("Tenant access denied");
  }
}

export function requireTenantAccess(
  tenantId: string | null
): (user: RbacUser) => RbacUser {
  return (user) => {
    assertSameTenant(user, tenantId);
    return user;
  };
}
