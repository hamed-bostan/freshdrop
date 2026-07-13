import { NextResponse, type NextRequest } from "next/server";
import { GetSimilarProducts } from "@/src/domain/use-cases/products/GetSimilarProducts";
import { productRepository } from "@/src/infrastructure/container";
import { getRequestLocale } from "@/src/lib/api/request-locale";
import { errorResponseFromException } from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id/similar — products related to :id (same category first),
 * excluding itself. Public. Returns an empty array when there are none.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  try {
    const products = await new GetSimilarProducts(productRepository).execute(id, getRequestLocale(request));
    return NextResponse.json(products);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/products/${id}/similar failed`);
  }
}
