import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/src/domain/entities/User";
import { GrantAdmin } from "@/src/domain/use-cases/team/GrantAdmin";
import { ListAdmins } from "@/src/domain/use-cases/team/ListAdmins";
import { userRepository } from "@/src/infrastructure/container";
import { breakGlassAdminIds, getAdminSession, isBreakGlassAdmin } from "@/src/lib/require-admin";
import { grantAdminSchema } from "@/src/presentation/dashboard/team/team-schema";
import type { TeamMember } from "@/src/presentation/dashboard/team/team-response-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Who holds admin access is read per request — never statically cached.
export const dynamic = "force-dynamic";

/** Project a user onto the team row shape, adding the flags only the API can know. */
function toTeamMember(user: User, viewerId: string): TeamMember {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isSelf: user.id === viewerId,
    breakGlass: isBreakGlassAdmin(user.id),
  };
}

/**
 * GET /api/admin/team — everyone who can reach the dashboard. Admin only.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const admins = await new ListAdmins(userRepository).execute(breakGlassAdminIds());
    return NextResponse.json(admins.map((admin) => toTeamMember(admin, session.user.id)));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/team failed");
  }
}

/**
 * POST /api/admin/team — grant admin access to a phone number. Admin only.
 *
 * Thin controller: authenticate → validate (same Zod schema the form uses) →
 * delegate to the use-case → map domain errors to HTTP status codes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = grantAdminSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const granted = await new GrantAdmin(userRepository).execute(parsed.data.phone);
    return NextResponse.json(toTeamMember(granted, session.user.id), { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/team failed");
  }
}
