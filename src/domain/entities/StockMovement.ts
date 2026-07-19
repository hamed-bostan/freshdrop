/**
 * The stock ledger: one entry per change to a product's on-hand quantity, so a
 * level is never just a number that moved overnight — it has a reason and someone
 * (or something) to attribute it to.
 *
 * Append-only, like the role-change log. Entries are written inside the same
 * transaction as the quantity they describe (see `IProductRepository`), so a
 * movement can't go missing while its stock change commits, or the reverse.
 * Framework-free, so it's importable from anywhere in the app.
 */

/**
 * Why stock moved. Deliberately a closed set: "the number changed" is not a
 * reason, and a free-text field would collect four spellings of "damaged" within
 * a month. `note` carries the specifics.
 */
export const STOCK_MOVEMENT_REASONS = ["restock", "shrinkage", "correction", "sale"] as const;
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

/**
 * The reasons an operator may choose from in the adjust form — everything except
 * `sale`, which only checkout writes.
 *
 * Letting an admin pick "sale" would let them enter a sale that never happened
 * into the same ledger the revenue side reads as fact. Removing stock that walked
 * out the door unrecorded is `shrinkage`; fixing a miscount is `correction`.
 */
export const ADMIN_STOCK_MOVEMENT_REASONS = ["restock", "shrinkage", "correction"] as const;
export type AdminStockMovementReason = (typeof ADMIN_STOCK_MOVEMENT_REASONS)[number];

/** Narrow an arbitrary string to an operator-choosable reason. */
export function isAdminStockMovementReason(value: string): value is AdminStockMovementReason {
  return (ADMIN_STOCK_MOVEMENT_REASONS as readonly string[]).includes(value);
}

/** How many entries the history panel reads when the caller doesn't say. */
export const DEFAULT_STOCK_MOVEMENT_LIMIT = 20;

/**
 * Hard ceiling on entries per read. The limit can arrive from a query string, so
 * it's caller-controlled input — without a clamp, `?limit=100000` asks the server
 * to ship a product's entire sales history into a side panel.
 */
export const MAX_STOCK_MOVEMENT_LIMIT = 100;

/** Coerce a possibly-hostile limit into a safe one. */
export function clampMovementLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_STOCK_MOVEMENT_LIMIT;
  return Math.min(MAX_STOCK_MOVEMENT_LIMIT, Math.max(1, Math.floor(limit as number)));
}

/**
 * One recorded change to a product's on-hand quantity.
 *
 * Attribution is exactly one of two shapes, never both and never neither: an
 * operator's adjustment carries `actorId`/`actorName`, while a movement an order
 * drove carries `orderId`. Keeping them separate (rather than one "actor" string
 * holding sometimes a person and sometimes an order id) means the UI can link each
 * to the right place, and nobody has to guess which kind of id they're holding.
 *
 * `actorName` is snapshotted at the time of the change rather than resolved on
 * read — the same treatment order lines give product names, so an entry stays
 * truthful after a rename, or after the account is gone entirely.
 */
export type StockMovement = {
  id: string;
  productId: string;
  /** Signed change in units: positive went onto the shelf, negative came off. Never 0. */
  delta: number;
  /**
   * Units on hand once this movement was applied. Stored rather than derived so
   * the history reads without replaying every entry from the beginning — and so a
   * gap (a row written before the ledger shipped) can't silently shift every
   * level after it.
   */
  quantityAfter: number;
  reason: StockMovementReason;
  /** What the operator typed, when they typed anything ("damaged in transit"). */
  note?: string;
  /** The admin who made the change; absent when an order drove it. */
  actorId?: string;
  /** Their name at the time of the change. */
  actorName?: string;
  /** The order that drove the change; absent for an operator's manual adjustment. */
  orderId?: string;
  at: Date;
};
