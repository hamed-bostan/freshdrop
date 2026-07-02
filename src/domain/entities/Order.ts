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
 * What the customer pre-approved should happen to a line if it turns out to be
 * out of stock when a picker prepares the order — the grocery "substitutions"
 * choice made at checkout.
 *
 * - `substitute` — the customer is happy to receive a comparable replacement the
 *   picker chooses; they're only ever charged the lower of the two prices.
 * - `refund` — no substitution: the line is dropped and its value refunded.
 */
export type SubstitutionPreference = "substitute" | "refund";

/**
 * The outcome recorded once a picker resolves an out-of-stock line — absent while
 * the line is still expected to be fulfilled as ordered.
 *
 * - `substituted` — swapped for `replacement`; any price saving was refunded.
 * - `refunded` — dropped from the order and its value refunded to the wallet.
 */
export type ItemSubstitution = {
  status: "substituted" | "refunded";
  /** The product the line was replaced with — present only when `substituted`. */
  replacement?: {
    productId: string;
    name: string;
    imageUrl: string;
  };
  /**
   * The exact amount credited to the customer's wallet for this line: the line
   * refund when `refunded`, or the price saving when `substituted` for a cheaper
   * item (0 when the swap wasn't cheaper). Already net of the line's pro-rata
   * discount share (see {@link refundForLineValue}). The order `total` stays the
   * original charge; this is what makes each wallet credit visible on the receipt.
   */
  refundAmount: number;
}

/**
 * A single line in an order. Carries a display snapshot (name + image + unit
 * price) alongside the product id so the order remains a faithful record — and a
 * correct basis for substitution refunds — even if the catalog changes later.
 */
export type OrderItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  /** Unit price captured at purchase — the basis for a substitution refund. */
  price: number;
  /** The customer's out-of-stock pre-approval for this line (see {@link SubstitutionPreference}). */
  substitutionPreference: SubstitutionPreference;
  /** The picker's resolution of an out-of-stock line; `undefined` while unresolved. */
  substitution?: ItemSubstitution;
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
  /**
   * The order's price breakdown captured at checkout — the faithful record of what
   * was charged, and the basis for correctly pro-rating a partial refund (an
   * out-of-stock line's refund is its share of the discount, not its sticker
   * price). `total = subtotal + shipping - discount`.
   */
  /** Merchandise total before delivery fee and discount — the sum of each line's price × qty. */
  subtotal: number;
  /** Delivery fee charged on the order. Not refunded when a single line is out of stock (the delivery still happens). */
  shipping: number;
  /** Amount taken off the order (promo, offers), allocated across lines pro-rata for partial refunds. */
  discount: number;
  /** Amount actually charged: `subtotal + shipping - discount`. */
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
 * The fraction of merchandise value the order's discount took off (0 when there
 * was none) — used to allocate that discount across lines when refunding part of
 * an order. Refunding a line at its full sticker price would over-refund a
 * discounted order, so the customer is refunded what they *effectively paid*:
 * `lineValue × (1 − discountRate)`. Clamped to [0, 1]; a zero subtotal yields 0.
 *
 * The standard grocery rule: the delivery fee is excluded (a partial out-of-stock
 * still gets delivered), so only the merchandise discount is pro-rated here.
 */
export function orderDiscountRate(order: Order): number {
  if (!(order.subtotal > 0)) return 0;
  return Math.min(Math.max(order.discount / order.subtotal, 0), 1);
}

/**
 * The amount to refund for `grossLineValue` (a line's price × qty, or a swap's
 * price saving) on `order` — the gross value net of the line's pro-rata share of
 * the order discount, rounded to whole cents. Never negative.
 */
export function refundForLineValue(order: Order, grossLineValue: number): number {
  const net = grossLineValue * (1 - orderDiscountRate(order));
  return Math.max(Math.round(net * 100) / 100, 0);
}

/**
 * Whether `order` is currently being picked/prepared — the window in which a
 * picker resolves out-of-stock lines (substitute or refund). Live, in progress,
 * and not yet dispatched (`confirmed`); once it's `shipped` the pick is done and
 * substitutions are closed. Shared by the picker use-case (server-side guard) and
 * the dashboard control (whether to offer the action), so the two never diverge —
 * this is deliberately the same gate as {@link isCancellable}.
 */
export function isPicking(order: Order): boolean {
  return order.phase === "current" && order.status === "processing" && order.stage === "confirmed";
}

/**
 * The delivery fee credited back for this order, if any. Non-zero only when the
 * order was cancelled because every line was out of stock ({@link isFullyRefunded})
 * — the empty-delivery case where the standard grocery rule refunds shipping too
 * (a partial out-of-stock never refunds it, since the delivery still happens).
 * Derived, not stored: `cancelled` + fully refunded uniquely identifies that path
 * (a customer cancellation has no per-line refunds, so it isn't fully refunded).
 */
export function orderShippingRefunded(order: Order): number {
  return order.status === "cancelled" && isFullyRefunded(order) ? order.shipping : 0;
}

/**
 * Total credited back to the customer's wallet for this order — the sum of each
 * resolved line's `refundAmount`, plus the delivery fee when the whole order was
 * refunded ({@link orderShippingRefunded}). 0 when nothing was refunded. The order
 * `total` is left as the original charge; this makes the wallet credits visible as
 * an itemized adjustment (the receipt shoppers expect).
 */
export function orderRefundedTotal(order: Order): number {
  const lineRefunds = order.items.reduce((sum, item) => sum + (item.substitution?.refundAmount ?? 0), 0);
  return lineRefunds + orderShippingRefunded(order);
}

/**
 * What the customer actually paid after out-of-stock refunds: the original
 * `total` minus {@link orderRefundedTotal}. Equals `total` when nothing was
 * refunded.
 */
export function orderNetPaid(order: Order): number {
  return order.total - orderRefundedTotal(order);
}

/**
 * Whether every line in `order` ended up refunded during picking — the order now
 * has nothing left to deliver. A `substituted` line still has something to
 * deliver, so any substitution (or any still-unresolved line) makes this false.
 * The shared gate for cancelling a fully out-of-stock order and refunding the
 * delivery fee too: refunding just one line never refunds shipping (the delivery
 * still happens — see {@link refundForLineValue}), but refunding the *last* line
 * leaves an empty delivery, which the standard grocery rule cancels and fully
 * refunds. A no-item order is never "fully refunded".
 */
export function isFullyRefunded(order: Order): boolean {
  return (
    order.items.length > 0 &&
    order.items.every((item) => item.substitution?.status === "refunded")
  );
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
