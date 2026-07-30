import type {
  StockMovement,
  StockMovementFilters,
  StockMovementSort,
} from "../../entities/StockMovement";
import {
  DEFAULT_STOCK_MOVEMENT_DIRECTION,
  DEFAULT_STOCK_MOVEMENT_SORT,
} from "../../entities/StockMovement";
import type { IStockMovementLog } from "../../repositories/IStockMovementLog";
import type { SortDirection } from "../../entities/Pagination";
import { streamAllPages } from "./streamAllPages";

/** Stream the complete filtered stock ledger without buffering it in memory. */
export class ExportStockMovements {
  constructor(private readonly movements: IStockMovementLog) {}

  execute(
    filters: StockMovementFilters,
    sort: StockMovementSort = DEFAULT_STOCK_MOVEMENT_SORT,
    direction: SortDirection = DEFAULT_STOCK_MOVEMENT_DIRECTION,
  ): AsyncGenerator<StockMovement> {
    return streamAllPages<StockMovement, StockMovementSort>(
      (page) => this.movements.list(filters, page),
      { sort, direction },
    );
  }
}
