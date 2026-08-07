import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_STOCK_MOVEMENT_DIRECTION,
  DEFAULT_STOCK_MOVEMENT_SORT,
  STOCK_MOVEMENT_SORTS,
} from "@/src/domain/entities/StockMovement";
import { GetRecentStockMovements } from "@/src/domain/use-cases/products/GetRecentStockMovements";
import { ListStockMovements } from "@/src/domain/use-cases/products/ListStockMovements";
import { stockMovementLog } from "@/src/infrastructure/container";
import { parseAdminStockMovementFilters } from "@/src/lib/api/admin-stock-movement-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// The ledger is read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inventory/movements — the store's most recent stock movements
 * across every product, newest first. `catalog.write`, the same permission
 * `GET /api/products/:id/stock` requires: this is the same ledger, read across
 * products instead of one, and it names who moved what — operator information,
 * not something a read-only dashboard visitor needs.
 *
 * A `?limit` request remains available to the compact per-feature callers. Without
 * it, this returns the paginated inventory-ledger shape used by the dedicated view.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("catalog.write"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const rawLimit = params.get("limit");

  try {
    if (rawLimit !== null) {
      const movements = await new GetRecentStockMovements(stockMovementLog).execute(Number(rawLimit));
      return NextResponse.json(movements.map(toWire));
    }

    const filters = parseAdminStockMovementFilters(params);
    const page = parsePageRequest(params, STOCK_MOVEMENT_SORTS, {
      sort: DEFAULT_STOCK_MOVEMENT_SORT,
      direction: DEFAULT_STOCK_MOVEMENT_DIRECTION,
    });
    const result = await new ListStockMovements(stockMovementLog).execute(filters, page);
    return NextResponse.json({ ...result, items: result.items.map(toWire) });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/inventory/movements failed");
  }
}

function toWire<T extends { at: Date }>(entry: T): Omit<T, "at"> & { at: string } {
  return { ...entry, at: entry.at.toISOString() };
}
