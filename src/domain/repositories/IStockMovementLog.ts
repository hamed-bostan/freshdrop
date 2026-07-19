import type { StockMovement } from "../entities/StockMovement";

/**
 * Read access to the append-only stock ledger.
 *
 * Read-only by design, for the same reason `IRoleChangeLog` is: entries are
 * written by the `IProductRepository` methods that move stock, in the same
 * transaction as the quantity they describe. A `record` here would offer a second,
 * non-atomic way to write the same table — which is exactly the gap that
 * arrangement closes. A ledger whose entries can drift from the levels they
 * explain is worse than none, because it reads as authoritative without being so.
 */
export type IStockMovementLog = {
  /** A product's movements, most recent first, capped by `limit`. */
  listForProduct(productId: string, limit: number): Promise<StockMovement[]>;
};
