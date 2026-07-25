import type { GeoPoint } from "./Place";
import type { TrackingMilestone } from "./OrderTracking";

/**
 * Lifecycle status of an order — drives the status badge on the order card.
 *
 * Declared as an array with the union derived from it, so the statuses exist at
 * runtime too: the admin list validates a `?status=` query param against them,
 * and a union alone can't be checked against a string off the wire.
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
export const ORDER_STATUSES = [
  "completed",
  "processing",
  "cancelled",
  "return_requested",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
 * How the customer takes delivery of the order — the choice made at checkout.
 *
 * Declared as an array with the union derived from it, for the same reason as
 * {@link ORDER_STATUSES}: the admin list validates a `?delivery=` param against
 * it, which a bare union can't do at runtime.
 *
 * - `delivery` — couriered to the saved address; the trackable path.
 * - `pickup` — collected by the customer from the store; no courier, so an order
 *   on this path never leaves the `confirmed` milestone.
 */
export const DELIVERY_TYPES = ["delivery", "pickup"] as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[number];

/**
 * Where the money for an order stands — deliberately independent of
 * {@link OrderStatus}, which tracks the *goods*. The two diverge in exactly the
 * cases an operator cares about: a `processing` order whose payment `failed` is
 * the "needs attention" case, and a `cancelled` order can sit at `pending`
 * (never charged) or `refunded` (charged, then given back).
 *
 * - `paid` — settled; the normal state for an order that got placed at all.
 * - `pending` — authorised but not captured, or cash-on-delivery not yet collected.
 * - `failed` — the charge was declined or errored; nothing was taken.
 * - `refunded` — captured and since returned to the customer's wallet.
 */
export const PAYMENT_STATUSES = ["paid", "pending", "failed", "refunded"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

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
   * A per-line display label — the amount credited to the wallet for this line
   * (the line refund when `refunded`, or the price saving when `substituted` for
   * a cheaper item; 0 when the swap wasn't cheaper), already net of the line's
   * pro-rata discount share (see {@link refundForLineValue}). Kept for the order
   * card/receipt to show next to the line. No longer the source anything sums
   * across an order from — that's the `Refund` ledger now (see `Refund.ts`).
   */
  refundAmount: number;
}

/**
 * A single line in an order. Carries a display snapshot (name + image + unit
 * price) alongside the product id so the order remains a faithful record — and a
 * correct basis for substitution refunds — even if the catalog changes later.
 */
export type OrderItem = {
  /** The underlying row's id — the target of a line-item refund (see `RefundLine.orderItemId`). */
  id: string;
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
  /** Whether this line was VAT-exempt, snapshotted from the product at purchase time. */
  taxExempt: boolean;
  /**
   * VAT this line contributes to the order's {@link Order.taxAmount}, net of its
   * pro-rata discount share. `null` when tax wasn't in effect when the order was
   * placed (not the same as 0, which means "taxable but the line was exempt").
   */
  taxAmount: number | null;
}

/** A placed order shown on the "My Order" screen. */
export type Order = {
  id: string;
  /**
   * A short sequential number for humans — dashboard lists, order detail, support
   * conversations — where `id` (the real key) is either too long to scan or, sliced
   * down for space, indistinguishable from its neighbours. DB-assigned; nothing
   * ever supplies one.
   */
  orderNumber: number;
  /** The user who placed the order — orders are read back scoped to their owner. */
  userId: string;
  status: OrderStatus;
  phase: OrderPhase;
  /**
   * How the order is handed over — couriered or collected. Legacy orders placed
   * before the choice existed read as `delivery`, which is what they were.
   */
  deliveryType: DeliveryType;
  /**
   * Where the money stands, tracked separately from `status` (see
   * {@link PAYMENT_STATUSES}). Legacy orders read as `paid`: they were placed
   * under a flow that had no other outcome.
   */
  paymentStatus: PaymentStatus;
  /** ISO 8601 timestamp (UTC) the order was placed. Formatted in the presentation layer. */
  placedAt: string;
  /** Human-readable delivery address. */
  location: string;
  /**
   * Short saved-address label the order was delivered to ("Home", "Gym"), captured
   * from the selected delivery location at checkout. `undefined` for legacy orders
   * placed before it was recorded — the order card then falls back to the city.
   */
  locationLabel?: string;
  /**
   * The delivery coordinate, snapshotted from the selected location at checkout so
   * tracking maps the order to where it's actually going. `undefined` for legacy
   * orders (and for saved addresses that carry no coordinate) — tracking then falls
   * back to a default destination.
   */
  destination?: GeoPoint;
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
   * VAT portion of `total`, snapshotted at checkout (see `taxFromGross`) — never
   * recomputed later, so a subsequent rate change can't retroactively alter a past
   * order's reported tax. `null` means tax wasn't in effect when this order was
   * placed, which is not the same as 0 (a taxable order where every line happened
   * to be exempt still reads 0; a legacy order predating tax reads `null`).
   */
  taxAmount: number | null;
  /** The rate `taxAmount` was computed with, so the record is self-describing. `null` alongside `taxAmount`. */
  taxRate: number | null;
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
 * What this order contributes to revenue — 0 once the whole order was handed back
 * to the customer, otherwise {@link orderNetPaid}.
 *
 * Distinct from `orderNetPaid`, which answers "what did this customer pay for what
 * they kept" and so is what a *receipt* shows. Revenue needs the wallet-level view:
 * `cancelled` and `refunded` orders return the full `total` to the wallet
 * (`CancelOrder`, `ResolveOrderReturn`) without writing per-line `refundAmount`s, so
 * `orderNetPaid` still reports their original charge. Summing that as revenue counts
 * money the business gave back. Per-line out-of-stock refunds are already netted out
 * by `orderNetPaid` for every other status.
 *
 * The single definition of "revenue-recognized" — use it for any figure that
 * aggregates money *earned* (the overview KPI, per-customer spend), not for
 * displaying one order's charge.
 */
export function orderRecognizedRevenue(order: Order): number {
  if (order.status === "cancelled" || order.status === "refunded") return 0;
  return orderNetPaid(order);
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
