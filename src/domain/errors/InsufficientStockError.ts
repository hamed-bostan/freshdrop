/** One order line that couldn't be fully honoured: what was asked vs. what's on hand. */
export type StockShortfall = {
  /** The product that ran short. */
  productId: string;
  /** Its display name at the time of the attempt, for a readable message. */
  name: string;
  /** Units currently on hand (0 when the product is gone). */
  available: number;
  /** Units the order asked for. */
  requested: number;
};

/**
 * An order asked for more units than are on hand. Thrown by the stock decrement —
 * atomically, so the whole order is refused rather than partially oversold. The
 * presentation layer maps this to 409 Conflict; `shortfalls` names each offending
 * line so the message can tell the shopper exactly what's short.
 */
export class InsufficientStockError extends Error {
  constructor(
    public readonly shortfalls: readonly StockShortfall[],
    options?: { cause?: unknown },
  ) {
    super(messageFor(shortfalls), options);
    this.name = "InsufficientStockError";
  }
}

/** A shopper-facing summary: precise for a single short line, generic for several. */
function messageFor(shortfalls: readonly StockShortfall[]): string {
  if (shortfalls.length !== 1) return "Some items don't have enough stock left.";
  const [only] = shortfalls;
  return only.available === 0
    ? `"${only.name}" is out of stock.`
    : `Only ${only.available} of "${only.name}" left.`;
}
