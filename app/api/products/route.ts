import { NextResponse, type NextRequest } from "next/server";
import type { Product } from "@/src/domain/entities/Product";
import { GetProducts } from "@/src/domain/use-cases/products/GetProducts";
import { GetFeaturedProducts } from "@/src/domain/use-cases/products/GetFeaturedProducts";
import { GetSpecialOffers } from "@/src/domain/use-cases/products/GetSpecialOffers";
import { GetProductsByCategory } from "@/src/domain/use-cases/products/GetProductsByCategory";
import { productRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Products are read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/products — list products. Public.
 *
 * Filtered via query params (most specific wins):
 *   ?categoryId=<id> → products in a category
 *   ?featured=true   → featured products
 *   ?special=true    → products on special offer
 *   (none)           → every product
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const categoryId = params.get("categoryId");

  try {
    let products: Product[];
    if (categoryId) {
      products = await new GetProductsByCategory(productRepository).execute(categoryId);
    } else if (params.get("featured") === "true") {
      products = await new GetFeaturedProducts(productRepository).execute();
    } else if (params.get("special") === "true") {
      products = await new GetSpecialOffers(productRepository).execute();
    } else {
      products = await new GetProducts(productRepository).execute();
    }
    return NextResponse.json(products);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/products failed");
  }
}
