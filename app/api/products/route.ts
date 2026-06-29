import { NextResponse, type NextRequest } from "next/server";
import type { Product } from "@/src/domain/entities/Product";
import { GetProducts } from "@/src/domain/use-cases/products/GetProducts";
import { GetFeaturedProducts } from "@/src/domain/use-cases/products/GetFeaturedProducts";
import { GetSpecialOffers } from "@/src/domain/use-cases/products/GetSpecialOffers";
import { GetProductsByCategory } from "@/src/domain/use-cases/products/GetProductsByCategory";
import { CreateProduct } from "@/src/domain/use-cases/products/CreateProduct";
import { productRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { productFormSchema } from "@/src/presentation/dashboard/products/product-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

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

/**
 * POST /api/products — create a product. Admin only.
 *
 * Thin controller: authenticate → validate (same Zod schema the form uses) →
 * delegate to the use-case → map domain errors to HTTP status codes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = productFormSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const created = await new CreateProduct(productRepository).execute(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/products failed");
  }
}
