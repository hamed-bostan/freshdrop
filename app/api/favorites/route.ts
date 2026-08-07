import { NextResponse, type NextRequest } from "next/server";

import { GetFavorites } from "@/src/domain/use-cases/favorites/GetFavorites";
import { favoriteRepository } from "@/src/infrastructure/container";
import { getRequestLocale } from "@/src/lib/api/request-locale";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/favorites — the signed-in user's favorited products.
 *
 * Auth required: favorites are user data, so anonymous callers get 401. Product
 * names/units are served in the caller's negotiated locale (`Accept-Language`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getUserSession())) return unauthorizedResponse();

  try {
    const favorites = await new GetFavorites(favoriteRepository).execute(getRequestLocale(request));
    return NextResponse.json(favorites);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/favorites failed");
  }
}
