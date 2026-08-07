import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { ADMIN_PRODUCT_SORTS, DEFAULT_ADMIN_PRODUCT_SORT } from "@/src/domain/entities/AdminProductFilters";
import { buildProductsDataset } from "@/src/domain/use-cases/exports/datasets/ProductsDataset";
import { activityLog, productRepository } from "@/src/infrastructure/container";
import { parseAdminProductFilters } from "@/src/lib/api/admin-product-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream } from "@/src/lib/csv";
import { getSessionWith } from "@/src/lib/require-permission";

import type { NextRequest } from "next/server";

// A snapshot of the live catalog, per request.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/products — the catalog list as a streamed CSV. Admin only.
 *
 * Same query params as the products screen (`q`, `categoryId`, `stock`, `sort`),
 * parsed by the same functions — so `?stock=needsRestock` exports the restocking
 * round, which is the reason to want this file. See the orders export for why the
 * response is a bare streamed body rather than the JSON envelope. The columns live
 * in `buildProductsDataset`, shared with the job pipeline behind the custom export
 * builder. No date range: this is a snapshot of the current catalog, not a period.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminProductFilters(params);
    const { sort } = parsePageRequest(params, ADMIN_PRODUCT_SORTS, { sort: DEFAULT_ADMIN_PRODUCT_SORT });
    const dataset = buildProductsDataset({ products: productRepository }, filters, sort);
    const [section] = dataset.sections;

    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "products",
      entityLabel: "products",
      changes: singleChange("query", null, filters.query ?? "all"),
    });

    return csvResponse(csvFilename("products"), csvStream(section.header, section.rows));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/products failed");
  }
}
