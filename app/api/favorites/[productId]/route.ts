import { NextResponse, type NextRequest } from "next/server";
import { IsFavorite } from "@/src/domain/use-cases/favorites/IsFavorite";
import { AddFavorite } from "@/src/domain/use-cases/favorites/AddFavorite";
import { RemoveFavorite } from "@/src/domain/use-cases/favorites/RemoveFavorite";
import { favoriteRepository, productRepository } from "@/src/infrastructure/container";
import { getUserSession } from "@/src/lib/require-auth";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Per-user data — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ productId: string }> };

/** GET /api/favorites/:productId — whether the product is favorited. Auth required. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getUserSession())) return unauthorizedResponse();

  const { productId } = await params;
  try {
    const favorited = await new IsFavorite(favoriteRepository).execute(productId);
    return NextResponse.json({ favorited });
  } catch (error) {
    return errorResponseFromException(error, `GET /api/favorites/${productId} failed`);
  }
}

/** PUT /api/favorites/:productId — add to favorites (idempotent). Auth required. */
export async function PUT(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getUserSession())) return unauthorizedResponse();

  const { productId } = await params;
  try {
    await new AddFavorite(favoriteRepository, productRepository).execute(productId);
    return NextResponse.json({ favorited: true });
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/favorites/${productId} failed`);
  }
}

/** DELETE /api/favorites/:productId — remove from favorites. Auth required. 204. */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getUserSession())) return unauthorizedResponse();

  const { productId } = await params;
  try {
    await new RemoveFavorite(favoriteRepository).execute(productId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/favorites/${productId} failed`);
  }
}
