import { NextResponse, type NextRequest } from "next/server";
import { GetRecentStockMovements } from "@/src/domain/use-cases/products/GetRecentStockMovements";
import { stockMovementLog } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// The ledger is read per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inventory/movements — the store's most recent stock movements
 * across every product, newest first. `catalog.write`, the same permission
 * `GET /api/products/:id/stock` requires: this is the same ledger, read across
 * products instead of one, and it names who moved what — operator information,
 * not something a read-only dashboard visitor needs.
 *
 * `?limit` caps the entries (clamped by the use-case).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("catalog.write"))) return unauthorizedResponse();

  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? undefined : Number(rawLimit);

  try {
    const movements = await new GetRecentStockMovements(stockMovementLog).execute(limit);
    return NextResponse.json(movements);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/inventory/movements failed");
  }
}
