import { NextResponse, type NextRequest } from "next/server";
import type { Product } from "@/src/domain/entities/Product";
import { GetProducts } from "@/src/domain/use-cases/products/GetProducts";
import { GetFeaturedProducts } from "@/src/domain/use-cases/products/GetFeaturedProducts";
import { GetSpecialOffers } from "@/src/domain/use-cases/products/GetSpecialOffers";
import { SearchProducts } from "@/src/domain/use-cases/products/SearchProducts";
import { CreateProduct } from "@/src/domain/use-cases/products/CreateProduct";
import { hasProductSearchCriteria } from "@/src/domain/entities/ProductFilters";
import { productRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { productFormSchema } from "@/src/presentation/dashboard/products/product-schema";
import { parseProductFilters } from "@/src/lib/api/product-search-params";
import { getRequestLocale } from "@/src/lib/api/request-locale";
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
 * Filtered via query params:
 *   ?q / ?categoryId / ?minPrice / ?maxPrice / ?dietary (repeatable) /
 *   ?brand (repeatable) / ?sort
 *                    → catalog search (any filter, incl. a lone category, routes here)
 *   ?featured=true   → featured products
 *   ?special=true    → products on special offer
 *   (none)           → every product
 *
 * Every filtered read — including a lone `categoryId` — goes through the one
 * search pipeline so ordering has a single source of truth (its `sort`, default
 * name A–Z) and never diverges by which branch served the request.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const filters = parseProductFilters(params);
  const locale = getRequestLocale(request);

  try {
    let products: Product[];
    if (hasProductSearchCriteria(filters)) {
      products = await new SearchProducts(productRepository).execute(filters, locale);
    } else if (params.get("featured") === "true") {
      products = await new GetFeaturedProducts(productRepository).execute(locale);
    } else if (params.get("special") === "true") {
      products = await new GetSpecialOffers(productRepository).execute(locale);
    } else {
      products = await new GetProducts(productRepository).execute(locale);
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
