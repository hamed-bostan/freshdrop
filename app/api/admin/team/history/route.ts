import { NextResponse } from "next/server";
import { ListRoleChanges } from "@/src/domain/use-cases/team/ListRoleChanges";
import { roleChangeLog } from "@/src/infrastructure/container";
import { getOwnerSession } from "@/src/lib/require-admin";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Read per request — an audit trail that showed a cached past would be worthless.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/team/history — recent dashboard access changes, newest first.
 * Owner only, matching the rest of the team endpoints.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getOwnerSession())) return unauthorizedResponse();

  try {
    const changes = await new ListRoleChanges(roleChangeLog).execute();
    // Dates cross the wire as ISO strings; the client schema parses them back.
    return NextResponse.json(changes.map((change) => ({ ...change, at: change.at.toISOString() })));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/team/history failed");
  }
}
