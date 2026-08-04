import type { NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import {
  DEFAULT_STOCK_MOVEMENT_SORT,
  STOCK_MOVEMENT_SORTS,
} from "@/src/domain/entities/StockMovement";
import type { StockMovement } from "@/src/domain/entities/StockMovement";
import { ExportStockMovements } from "@/src/domain/use-cases/exports/ExportStockMovements";
import { activityLog, stockMovementLog } from "@/src/infrastructure/container";
import { parseAdminStockMovementFilters } from "@/src/lib/api/admin-stock-movement-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream, type CsvValue } from "@/src/lib/csv";

export const dynamic = "force-dynamic";

/** Export the exact filtered inventory ledger shown on screen. */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminStockMovementFilters(params);
    const { sort, direction } = parsePageRequest(params, STOCK_MOVEMENT_SORTS, {
      sort: DEFAULT_STOCK_MOVEMENT_SORT,
    });
    const movements = new ExportStockMovements(stockMovementLog).execute(filters, sort, direction);
    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "inventory",
      entityLabel: "inventory",
      changes: singleChange("range", null, `${filters.occurredFrom ?? "all"} .. ${filters.occurredTo ?? "all"}`),
    });
    return csvResponse(csvFilename("inventory-movements"), csvStream(HEADER, toRows(movements)));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/inventory-movements failed");
  }
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
