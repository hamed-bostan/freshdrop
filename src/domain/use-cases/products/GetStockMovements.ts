import type { StockMovement } from "../../entities/StockMovement";
import { clampMovementLimit } from "../../entities/StockMovement";
import type { IStockMovementLog } from "../../repositories/IStockMovementLog";

/**
 * A product's recent stock movements, newest first — what the history panel on
 * the edit screen reads.
 *
 * Capped rather than paged: this is a panel beside a form, not a list screen. An
 * operator opening it wants to know what happened to this product lately, and the
 * cap keeps a product with thousands of sales from shipping its whole history
 * into a page nobody scrolls. If "the full ledger" ever becomes a screen of its
 * own, it gets a `PageRequest` like the other management lists.
 */
export class GetStockMovements {
  constructor(private readonly log: IStockMovementLog) {}

  execute(productId: string, limit?: number): Promise<StockMovement[]> {
    if (!productId) return Promise.resolve([]);
    return this.log.listForProduct(productId, clampMovementLimit(limit));
  }
}
