import type { NextRequest } from "next/server";
import { singleChange } from "@/src/domain/entities/ActivityEntry";
import { DEFAULT_STOCK_MOVEMENT_SORT, STOCK_MOVEMENT_SORTS } from "@/src/domain/entities/StockMovement";
import { buildInventoryDataset } from "@/src/domain/use-cases/exports/datasets/InventoryDataset";
import { activityLog, stockMovementLog } from "@/src/infrastructure/container";
import { parseAdminStockMovementFilters } from "@/src/lib/api/admin-stock-movement-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream } from "@/src/lib/csv";

export const dynamic = "force-dynamic";

/**
 * Export the exact filtered inventory ledger shown on screen. The columns live
 * in `buildInventoryDataset`, shared with the job pipeline behind the custom
 * export builder.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;

  try {
    const filters = parseAdminStockMovementFilters(params);
    const { sort, direction } = parsePageRequest(params, STOCK_MOVEMENT_SORTS, {
      sort: DEFAULT_STOCK_MOVEMENT_SORT,
    });
    const period = `${filters.occurredFrom ?? "all"} .. ${filters.occurredTo ?? "all"}`;
    const dataset = buildInventoryDataset({ movements: stockMovementLog }, filters, sort, direction, period);
    const [section] = dataset.sections;

    await activityLog.recordEvent({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.id,
      action: "export.downloaded",
      entityType: "export",
      entityId: "inventory",
      entityLabel: "inventory",
      changes: singleChange("range", null, period),
    });

    return csvResponse(csvFilename("inventory-movements"), csvStream(section.header, section.rows));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/exports/inventory-movements failed");
  }
}
