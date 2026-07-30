import type {
  StockMovement,
  StockMovementFilters,
  StockMovementSort,
} from "../../entities/StockMovement";
import type { Page, PageRequest } from "../../entities/Pagination";
import type { IStockMovementLog } from "../../repositories/IStockMovementLog";

/** Read one filtered page of the store-wide, append-only inventory ledger. */
export class ListStockMovements {
  constructor(private readonly log: IStockMovementLog) {}

  execute(
    filters: StockMovementFilters,
    page: PageRequest<StockMovementSort>,
  ): Promise<Page<StockMovement>> {
    return this.log.list(filters, page);
  }
}
