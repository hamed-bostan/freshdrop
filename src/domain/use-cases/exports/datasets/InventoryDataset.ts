import type { SortDirection } from "@/src/domain/entities/Pagination";
import type { StockMovement, StockMovementFilters, StockMovementSort } from "@/src/domain/entities/StockMovement";
import type { IStockMovementLog } from "@/src/domain/repositories/IStockMovementLog";
import type { CsvValue } from "@/src/lib/csv";
import type { ReportDataset } from "@/src/lib/export-formats/report-dataset";
import { ExportStockMovements } from "../ExportStockMovements";

/**
 * The inventory report's one section — moved verbatim from
 * `app/api/admin/exports/inventory-movements/route.ts`. See `OrdersDataset`
 * for why this file, not the route, is the source of truth for its columns.
 */
export function buildInventoryDataset(
  deps: { movements: IStockMovementLog },
  filters: StockMovementFilters,
  sort: StockMovementSort | undefined,
  direction: SortDirection | undefined,
  period: string | null,
): ReportDataset {
  const movements = new ExportStockMovements(deps.movements).execute(filters, sort, direction);
  return {
    title: "inventory",
    period,
    sections: [{ id: "inventory", heading: "Inventory movements", header: HEADER, rows: toRows(movements) }],
  };
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
