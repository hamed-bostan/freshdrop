import type { NextRequest } from "next/server";
import {
  DEFAULT_STOCK_MOVEMENT_SORT,
  STOCK_MOVEMENT_SORTS,
} from "@/src/domain/entities/StockMovement";
import type { StockMovement } from "@/src/domain/entities/StockMovement";
import { ExportStockMovements } from "@/src/domain/use-cases/exports/ExportStockMovements";
import { stockMovementLog } from "@/src/infrastructure/container";
import { parseAdminStockMovementFilters } from "@/src/lib/api/admin-stock-movement-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { getSessionWith } from "@/src/lib/require-permission";
import { unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream, type CsvValue } from "@/src/lib/csv";

export const dynamic = "force-dynamic";

/** Export the exact filtered inventory ledger shown on screen. */
export async function GET(request: NextRequest): Promise<Response> {
  if (!(await getSessionWith("catalog.write"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminStockMovementFilters(params);
  const { sort, direction } = parsePageRequest(params, STOCK_MOVEMENT_SORTS, {
    sort: DEFAULT_STOCK_MOVEMENT_SORT,
  });
  const movements = new ExportStockMovements(stockMovementLog).execute(filters, sort, direction);
  return csvResponse(csvFilename("inventory-movements"), csvStream(HEADER, toRows(movements)));
}

const HEADER = [
  "id",
  "product_id",
  "change",
  "quantity_before",
  "quantity_after",
  "reason",
  "source_order_id",
  "actor_id",
  "actor_name",
  "note",
  "occurred_at",
] as const;

async function* toRows(movements: AsyncIterable<StockMovement>): AsyncGenerator<CsvValue[]> {
  for await (const movement of movements) {
    yield [
      movement.id,
      movement.productId,
      movement.delta,
      movement.quantityAfter - movement.delta,
      movement.quantityAfter,
      movement.reason,
      movement.orderId ?? "",
      movement.actorId ?? "",
      movement.actorName ?? "System",
      movement.note ?? "",
      movement.at.toISOString(),
    ];
  }
}
