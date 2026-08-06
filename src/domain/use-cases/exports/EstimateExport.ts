import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import type { ExportFormat, ExportJobParams, ExportJobReportId } from "@/src/domain/entities/ExportJob";
import type { StockMovementFilters } from "@/src/domain/entities/StockMovement";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IStockMovementLog } from "@/src/domain/repositories/IStockMovementLog";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { ListCustomerSummaries } from "../orders/ListCustomerSummaries";

export type EstimateExportDeps = {
  orders: IOrderRepository;
  users: IUserRepository;
  products: IProductRepository;
  movements: IStockMovementLog;
};

export type ExportEstimate = {
  rowCount: number;
  /** Bytes are a rough average per row for the chosen format, not a measurement — always labelled "Estimated" in the UI. */
  estimatedByteSize: number;
};

/**
 * How many rows the current builder selection would produce, and a rough
 * file-size guess — the Export summary sidebar's "Estimated rows" /
 * "Estimated size", computed live as the selection changes rather than
 * invented once and left static (which is what the reference mockup did).
 *
 * Reads a `pageSize: 1` page from the same repository call the dataset
 * builder would stream from, so the count is the real filtered total rather
 * than a second query with its own idea of what matches.
 */
export class EstimateExport {
  constructor(private readonly deps: EstimateExportDeps) {}

  async execute(reportId: ExportJobReportId, format: ExportFormat, params: ExportJobParams): Promise<ExportEstimate> {
    const rowCount = await this.countRows(reportId, params);
    return { rowCount, estimatedByteSize: rowCount * AVG_BYTES_PER_ROW[format] };
  }

  private async countRows(reportId: ExportJobReportId, params: ExportJobParams): Promise<number> {
    const page = { page: 1, pageSize: 1 } as const;

    switch (reportId) {
      case "orders": {
        const filters: AdminOrderFilters = toOrderFilters(params);
        const result = await this.deps.orders.listPage(filters, page);
        return result.total;
      }
      case "inventory": {
        const filters: StockMovementFilters = toMovementFilters(params);
        const result = await this.deps.movements.list(filters, page);
        return result.total;
      }
      case "customers": {
        const result = await new ListCustomerSummaries(this.deps.orders, this.deps.users).execute({}, page);
        return result.total;
      }
      case "products": {
        const result = await this.deps.products.listPage({}, page);
        return result.total;
      }
    }
  }
}

function toOrderFilters(params: ExportJobParams): AdminOrderFilters {
  if (!params.from || !params.to) return {};
  return { placedFrom: `${params.from}T00:00:00.000Z`, placedTo: `${params.to}T23:59:59.999Z` };
}

function toMovementFilters(params: ExportJobParams): StockMovementFilters {
  if (!params.from || !params.to) return {};
  return { occurredFrom: `${params.from}T00:00:00.000Z`, occurredTo: `${params.to}T23:59:59.999Z` };
}

/**
 * Rough per-row byte costs, format by format — CSV is closest to the raw
 * text, XLSX compresses (zip-backed), PDF carries page/font overhead on top
 * of the text. Coarse on purpose: the UI labels this "Estimated size",
 * never a promise.
 */
const AVG_BYTES_PER_ROW: Record<ExportFormat, number> = {
  csv: 90,
  xlsx: 55,
  pdf: 120,
};
