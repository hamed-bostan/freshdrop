import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/src/domain/entities/User";
import { GrantAdmin } from "@/src/domain/use-cases/team/GrantAdmin";
import { ListAdmins } from "@/src/domain/use-cases/team/ListAdmins";
import { adminInviteNotifier, userRepository } from "@/src/infrastructure/container";
import { breakGlassAdminIds, getAdminSession, isBreakGlassAdmin } from "@/src/lib/require-admin";
import { getAppUrl } from "@/src/lib/appUrl";
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

/**
 * Project the admin list onto the team rows, adding the facts only the API can
 * know. `revokeBlocked` mirrors exactly what `RevokeAdmin` (plus the break-glass
 * check in the `[id]` route) will refuse, so the UI never offers a Remove that the
 * server would reject — the count it depends on is of *database* admins, which is
 * what the last-admin rule actually protects, not of rendered rows.
 */
function toTeamMembers(admins: User[], viewerId: string): TeamMember[] {
  const dbAdminCount = admins.filter((admin) => admin.role === "admin").length;

  return admins.map((user) => {
    const breakGlass = isBreakGlassAdmin(user.id);
    const isSelf = user.id === viewerId;

    // Ordered to match the order the server actually applies the checks, so the
    // reason shown is the one that would come back from a real attempt.
    const revokeBlocked = isSelf
      ? ("self" as const)
      : breakGlass
        ? ("breakGlass" as const)
        : dbAdminCount <= 1
          ? ("lastAdmin" as const)
          : null;

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isSelf,
      breakGlass,
      revokeBlocked,
    };
  });
}

/**
 * GET /api/admin/team — everyone who can reach the dashboard. Admin only.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const admins = await new ListAdmins(userRepository).execute(breakGlassAdminIds());
    return NextResponse.json(toTeamMembers(admins, session.user.id));
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
    // The invitation links back to this deployment's sign-in page, so the origin
    // is resolved from the request (only the web layer knows the public host).
    const signInUrl = `${await getAppUrl()}/login`;
    const granted = await new GrantAdmin(userRepository, adminInviteNotifier).execute(
      parsed.data,
      signInUrl,
    );
    // Re-list so `revocable` is computed against the post-grant admin count rather
    // than guessed from the single row we just wrote.
    const admins = await new ListAdmins(userRepository).execute(breakGlassAdminIds());
    const member = toTeamMembers(admins, session.user.id).find((row) => row.id === granted.id);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/team failed");
  }
}
