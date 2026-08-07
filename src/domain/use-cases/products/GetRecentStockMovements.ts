import { clampMovementLimit } from "../../entities/StockMovement";

import type { StockMovement } from "../../entities/StockMovement";
import type { IStockMovementLog } from "../../repositories/IStockMovementLog";

/**
 * The store's most recent stock movements across every product, newest first —
 * the inventory page's activity feed. `GetStockMovements`'s counterpart for "what
 * happened lately" rather than "what happened to this one product".
 *
 * Capped rather than paged, for the same reason `GetStockMovements` is: this is a
 * panel on an operator's workflow page, not a list screen a search narrows down.
 */
export class GetRecentStockMovements {
  constructor(private readonly log: IStockMovementLog) {}

  execute(limit?: number): Promise<StockMovement[]> {
    return this.log.listRecent(clampMovementLimit(limit));
  }
}
