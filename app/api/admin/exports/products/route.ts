import type { NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import {
  ADMIN_PRODUCT_SORTS,
  DEFAULT_ADMIN_PRODUCT_SORT,
} from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { ExportProducts } from "@/src/domain/use-cases/exports/ExportProducts";
import { activityLog, productRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAdminProductFilters } from "@/src/lib/api/admin-product-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream, type CsvValue } from "@/src/lib/csv";

// A snapshot of the live catalog, per request.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/products — the catalog list as a streamed CSV. Admin only.
 *
 * Same query params as the products screen (`q`, `categoryId`, `stock`, `sort`),
 * parsed by the same functions — so `?stock=needsRestock` exports the restocking
 * round, which is the reason to want this file. See the orders export for why the
 * response is a bare streamed body rather than the JSON envelope.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminProductFilters(params);
    const { sort } = parsePageRequest(params, ADMIN_PRODUCT_SORTS, { sort: DEFAULT_ADMIN_PRODUCT_SORT });
    const products = new ExportProducts(productRepository).execute(filters, sort);
    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "products",
      entityLabel: "products",
      changes: singleChange("query", null, filters.query ?? "all"),
    });
    return csvResponse(csvFilename("products"), csvStream(HEADER, toRows(products)));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/products failed");
  }
}

/**
 * The columns. `stock_level` carries the domain's own classification rather than
 * leaving the reader to compare `stock_quantity` against a threshold they'd have to
 * know — so the file says "low" exactly where the dashboard does.
 */
const HEADER = [
  "id",
  "name",
  "category_id",
  "brand",
  "unit",
  "price",
  "original_price",
  "discount_percent",
  "stock_quantity",
  "stock_level",
  "rating",
  "rating_count",
  "is_featured",
] as const;

async function* toRows(products: AsyncIterable<Product>): AsyncGenerator<CsvValue[]> {
  for await (const product of products) {
    yield [
      product.id,
      product.name,
      product.categoryId,
      product.brand ?? "",
      product.unit ?? "",
      product.price,
      product.originalPrice ?? "",
      product.discountPercent ?? "",
      product.stockQuantity,
      getStockStatus(product.stockQuantity).level,
      product.rating,
      product.ratingCount,
      product.isFeatured,
    ];
  }
}
