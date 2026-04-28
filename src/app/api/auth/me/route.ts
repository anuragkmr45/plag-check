import { NextResponse } from "next/server";
import { toAuthenticatedUserResponse } from "../../../../lib/auth/http";
import { getCurrentUserFromRequest } from "../../../../server/services/auth.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getCurrentUserFromRequest(request);

  if (!result) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: toAuthenticatedUserResponse(result.user)
  });
}
