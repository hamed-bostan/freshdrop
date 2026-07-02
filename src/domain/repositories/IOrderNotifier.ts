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
};
