import { NextResponse, type NextRequest } from "next/server";
import { GetOrCreateUser } from "@/src/domain/use-cases/profile/GetOrCreateUser";
import { UpdateProfile } from "@/src/domain/use-cases/profile/UpdateProfile";
import { userRepository, imageStorageRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { profileUpdateSchema } from "@/src/contracts/profile-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/profile — the signed-in user's profile.
 *
 * Get-or-create from the session: a user who signed in before the users table
 * existed is backfilled here rather than 404ing. The session has no phone, so we
 * fall back to the id (which *is* the normalized phone) for legacy rows; rows
 * created at sign-in already carry the real phone.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const user = await new GetOrCreateUser(userRepository).execute({
      id: session.user.id,
      phone: session.user.id,
      name: session.user.name ?? "FreshDrop Customer",
    });
    return NextResponse.json(user);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/profile failed");
  }
}

/**
 * PUT /api/profile — update the signed-in user's own profile. Auth required; a
 * user can only ever edit their own record (the id comes from the session).
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = profileUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new UpdateProfile(userRepository, imageStorageRepository).execute(
      session.user.id,
      parsed.data,
    );
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, "PUT /api/profile failed");
  }
}
