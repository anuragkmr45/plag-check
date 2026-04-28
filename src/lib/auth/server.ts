import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ValidatedSession } from "../../server/services/auth.service";
import { requireAuth, requireRole } from "../rbac/guards";
import type { UserRole } from "../rbac/roles";

export async function getRequiredSession(): Promise<ValidatedSession> {
  try {
    return await requireAuth({
      headers: await headers()
    });
  } catch {
    redirect("/login");
  }
}

export async function getRequiredSessionWithRole(
  roles: readonly UserRole[]
): Promise<ValidatedSession> {
  const session = await getRequiredSession();

  try {
    requireRole(roles)(session.user);
  } catch {
    redirect("/dashboard");
  }

  return session;
}
