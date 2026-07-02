import type { TrackingMilestone } from "./OrderTracking";

/**
 * Lifecycle status of an order — drives the status badge on the order card.
 *
 * - `processing` — placed and in flight (awaiting/undergoing delivery).
 * - `completed` — delivered.
 * - `cancelled` — called off by the customer before dispatch; items restocked
 *   and the total refunded to the wallet.
 * - `return_requested` — a delivered order the customer has asked to return;
 *   awaiting an admin decision (mirrors the review-moderation flow).
 * - `refunded` — a requested return an admin approved; items restocked and the
 *   total refunded to the wallet.
 */
export type OrderStatus =
  | "completed"
  | "processing"
  | "cancelled"
  | "return_requested"
  | "refunded";

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
  /** The user who placed the order — orders are read back scoped to their owner. */
  userId: string;
  status: OrderStatus;
  phase: OrderPhase;
  /** ISO 8601 timestamp (UTC) the order was placed. Formatted in the presentation layer. */
  placedAt: string;
  /** Human-readable delivery address. */
  location: string;
  items: OrderItem[];
  /** Order total in the store currency. */
  total: number;
  /**
   * The delivery milestone the order is currently at — the single field an admin
   * advances from the dashboard, and what the tracking stepper is derived from.
   * `undefined` when the order isn't trackable (archived or cancelled).
   */
  stage?: TrackingMilestone;
  /**
   * The delivery slot the shopper booked at checkout. `deliveryWindow` is a display
   * snapshot ("Tomorrow, 6:00 – 8:00 PM") captured at purchase time; `deliveryDate`
   * (YYYY-MM-DD) + `deliveryWindowId` are the machine references. All `undefined`
   * for orders placed before slot booking existed (seeded/legacy history).
   */
  deliveryDate?: string;
  deliveryWindowId?: string;
  deliveryWindow?: string;
}

/**
 * How long after an order is placed a customer may still request a return, in
 * days — the industry-standard 30-day window. We key it off `placedAt` (the
 * order carries no separate delivered-at timestamp), a deliberate approximation:
 * the window is generous, so measuring from placement only ever grants *more*
 * time than measuring from delivery would.
 */
export const RETURN_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the customer can still cancel `order`. Allowed only before dispatch:
 * the order must be live, in progress, and still at the first delivery milestone
 * (`confirmed`). Once it's `shipped`, cancellation is closed and the customer
 * must return the delivered order instead — the same cut-off large stores use.
 *
 * Pure and shared: the cancel use-case enforces it server-side and the order
 * card uses it to decide whether to show the button, so the two never diverge.
 */
export function isCancellable(order: Order): boolean {
  return order.phase === "current" && order.status === "processing" && order.stage === "confirmed";
}

/**
 * Whether the customer can request a return on `order` at `now`: it must be
 * delivered (`completed`) and still inside the {@link RETURN_WINDOW_DAYS} window
 * measured from `placedAt`. Shared between the request use-case and the card.
 */
export function isReturnable(order: Order, now: Date = new Date()): boolean {
  if (order.status !== "completed") return false;
  const elapsedDays = (now.getTime() - new Date(order.placedAt).getTime()) / DAY_MS;
  return elapsedDays <= RETURN_WINDOW_DAYS;
}
