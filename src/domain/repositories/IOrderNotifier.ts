import type { Order } from "../entities/Order";

/**
 * Delivers transactional order notifications to the customer — the lifecycle
 * moments a delivery app must surface (confirmed → out for delivery → delivered,
 * plus an approved return). A port (not an implementation) so the domain stays
 * channel-agnostic: the container binds a concrete notifier that fans out to SMS,
 * push, etc. without any use-case knowing the channels — the same Dependency
 * Inversion the repositories and {@link IStockAlertNotifier} use.
 *
 * Every method is **best-effort**: the triggering state change (the order was
 * placed, advanced, or refunded) has already committed, so a delivery failure is
 * swallowed and logged by the implementation, never rethrown. Callers treat these
 * as side effects, not steps — a notification hiccup must never fail the request.
 */
export type IOrderNotifier = {
  /** The order was just placed — tell the customer it's confirmed. */
  orderConfirmed(order: Order): Promise<void>;
  /** The order just advanced to `shipped` — tell the customer it's on the way. */
  orderOutForDelivery(order: Order): Promise<void>;
  /** The order just reached `arrived` — tell the customer it was delivered. */
  orderDelivered(order: Order): Promise<void>;
  /** An admin approved the customer's return and refunded it — tell them. */
  returnApproved(order: Order): Promise<void>;
  /**
   * A picker replaced an out-of-stock line with a comparable item the customer had
   * pre-approved — tell them what changed (and, when cheaper, that the saving was
   * refunded). `itemName`/`replacementName` are the swapped products' names.
   */
  itemSubstituted(order: Order, itemName: string, replacementName: string): Promise<void>;
  /**
   * A picker dropped an out-of-stock line the customer chose not to substitute and
   * refunded its value — tell them which item and that it was refunded.
   */
  itemRefunded(order: Order, itemName: string): Promise<void>;
  /**
   * Every line turned out to be out of stock and was refunded, so the order was
   * cancelled and fully refunded (delivery fee included) — tell the customer there
   * was nothing left to deliver and they've been made whole.
   */
  orderCancelledOutOfStock(order: Order): Promise<void>;
};
