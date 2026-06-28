/** Lifecycle status of an order — drives the status badge on the order card. */
export type OrderStatus = "completed" | "processing" | "cancelled";

/**
 * Which tab an order belongs under. Kept separate from `status` because the
 * grouping is a presentation concern the backend owns: "current" are the orders
 * the user is still engaged with (recent, trackable, reorderable) and "previous"
 * is archived history — a recently *completed* delivery can still sit under
 * "current", which is why this isn't derived from `status`.
 */
export type OrderPhase = "current" | "previous";

/**
 * A single line in an order. Carries a display snapshot (name + image) alongside
 * the product id so the order remains a faithful record even if the catalog
 * changes later.
 */
export type OrderItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
}

/** A placed order shown on the "My Order" screen. */
export type Order = {
  id: string;
  status: OrderStatus;
  phase: OrderPhase;
  /** ISO 8601 timestamp (UTC) the order was placed. Formatted in the presentation layer. */
  placedAt: string;
  /** Human-readable delivery address. */
  location: string;
  items: OrderItem[];
  /** Order total in the store currency. */
  total: number;
}
