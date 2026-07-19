import type { AdminOrderFilters, AdminOrderSort } from "../entities/AdminOrderFilters";
import type { ItemSubstitution, Order, OrderPhase, OrderStatus } from "../entities/Order";
import type { TrackingMilestone } from "../entities/OrderTracking";
import type { Page, PageRequest } from "../entities/Pagination";

/** The fields a delivery-stage transition writes (computed by the use-case, persisted by the repo). */
export type OrderTrackingUpdate = {
  /** The milestone the order is being moved to. */
  stage: TrackingMilestone;
  /** The lifecycle status the milestone implies (e.g. `arrived` ⇒ `completed`). */
  status: OrderStatus;
};

/** Everything needed to persist a new order — an `Order` minus its generated id. */
export type NewOrder = Omit<Order, "id">;

/**
 * A guarded lifecycle transition. `from` (status, and optionally stage) is a
 * precondition matched *atomically* with the write, so a transition only lands
 * when the order is still in the expected state — the guard against double
 * cancels/refunds and races with a concurrent stage advance. `to` is the new
 * status; `phase`/`stage` are set when provided (`stage: null` clears it).
 */
export type OrderStatusTransition = {
  from: { status: OrderStatus; stage?: TrackingMilestone };
  to: {
    status: OrderStatus;
    phase?: OrderPhase;
    stage?: TrackingMilestone | null;
  };
};

export type IOrderRepository = {
  /** A user's orders, newest first. */
  getOrders(userId: string): Promise<Order[]>;

  /**
   * Every order, newest first — the admin dashboard's cross-user view.
   *
   * Whole-history read, kept for the overview's KPIs, which aggregate across all
   * orders. The order *list* uses {@link listPage}; this one is on borrowed time
   * and should give way to aggregate queries rather than growing more callers.
   */
  getAllOrders(): Promise<Order[]>;

  /** One page of the admin order list, plus the total matching the filters. */
  listPage(filters: AdminOrderFilters, page: PageRequest<AdminOrderSort>): Promise<Page<Order>>;

  /** A single order by id, or `null` when none matches. */
  getById(orderId: string): Promise<Order | null>;

  /** Persist a newly placed order, returning it with its generated id. */
  createOrder(input: NewOrder): Promise<Order>;

  /**
   * Apply a delivery-stage transition to an order, returning the updated order.
   * Throws `NotFoundError` when no order matches `orderId`.
   */
  setTrackingStage(orderId: string, update: OrderTrackingUpdate): Promise<Order>;

  /**
   * Atomically apply a guarded lifecycle transition (see {@link OrderStatusTransition}).
   * Returns the updated order when the `from` precondition matched, or `null`
   * when it didn't (unknown id, or the order had already moved on) — so a caller
   * that also moves money/stock only does so when it observes a real transition,
   * making cancel/return idempotent under double-submit and safe under races.
   */
  transitionStatus(orderId: string, transition: OrderStatusTransition): Promise<Order | null>;

  /**
   * Record a picker's resolution of an out-of-stock line, guarded so it only
   * lands while the line is still unresolved. Returns the updated order when this
   * call is the one that resolved the line, or `null` when it didn't match
   * (unknown order/line, or the line was already resolved on another pick) — so
   * the caller runs the refund/stock side effects only for the winning call,
   * making the pick idempotent under double-submit and safe under races, exactly
   * like {@link transitionStatus}.
   */
  resolveItemSubstitution(
    orderId: string,
    productId: string,
    resolution: ItemSubstitution,
  ): Promise<Order | null>;
}
