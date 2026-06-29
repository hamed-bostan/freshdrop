import { NextResponse, type NextRequest } from "next/server";
import { GetProductById } from "@/src/domain/use-cases/products/GetProductById";
import { productRepository } from "@/src/infrastructure/container";
import { errorResponse, errorResponseFromException } from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id — fetch one product. Public. 404 when it doesn't exist.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  try {
    const product = await new GetProductById(productRepository).execute(id);
    if (!product) return errorResponse(404, { message: "Product not found.", code: "NOT_FOUND" });
    return NextResponse.json(product);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/products/${id} failed`);
  }
}
