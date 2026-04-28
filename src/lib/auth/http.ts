import type { AuthenticatedUser } from "../../server/services/auth.service";

export type AuthenticatedUserResponse = {
  email: string;
  id: string;
  isActive: boolean;
  role: AuthenticatedUser["role"];
  tenantId: string | null;
};

export function getRequestAuditContext(request: Pick<Request, "headers">): {
  ip: string | null;
  userAgent: string | null;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return {
    ip: firstForwardedIp || request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent")
  };
}

export function toAuthenticatedUserResponse(
  user: AuthenticatedUser
): AuthenticatedUserResponse {
  return {
    email: user.email,
    id: user.id,
    isActive: user.isActive,
    role: user.role,
    tenantId: user.tenantId
  };
}
