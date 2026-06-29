import { NextResponse } from "next/server";
import { GetFavorites } from "@/src/domain/use-cases/favorites/GetFavorites";
import { favoriteRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/favorites — the signed-in user's favorited products.
 *
 * Auth required: favorites are user data, so anonymous callers get 401.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getUserSession())) return unauthorizedResponse();

  try {
    const favorites = await new GetFavorites(favoriteRepository).execute();
    return NextResponse.json(favorites);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/favorites failed");
  }
}
