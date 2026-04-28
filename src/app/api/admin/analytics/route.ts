import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAnalytics } from "../../../../features/analytics/analytics.service";
import { AuthorizationError } from "../../../../lib/rbac/guards";
import { getCurrentUserFromRequest } from "../../../../server/services/auth.service";

export const dynamic = "force-dynamic";

const analyticsQuerySchema = z.object({
  tenant_id: z.string().uuid().optional()
});

export async function GET(request: Request): Promise<NextResponse> {
  const session = await getCurrentUserFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedQuery = analyticsQuerySchema.safeParse({
    tenant_id: url.searchParams.get("tenant_id") ?? undefined
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid tenant_id" }, { status: 400 });
  }

  try {
    const analytics = await getAdminAnalytics(session.user, {
      tenantId: parsedQuery.data.tenant_id
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    throw error;
  }
}
