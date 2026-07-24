import type { AdminOrderFilters, AdminOrderSort } from "../entities/AdminOrderFilters";
import type { ItemSubstitution, Order, OrderPhase, OrderStatus, PaymentStatus } from "../entities/Order";
import type { TrackingMilestone } from "../entities/OrderTracking";
import type { Page, PageRequest } from "../entities/Pagination";
import type { AuditHook } from "./AuditHook";

/** The fields a delivery-stage transition writes (computed by the use-case, persisted by the repo). */
export type OrderTrackingUpdate = {
  /** The milestone the order is being moved to. */
  stage: TrackingMilestone;
  /** The lifecycle status the milestone implies (e.g. `arrived` ⇒ `completed`). */
  status: OrderStatus;
};

/** Everything needed to persist a new order — an `Order` minus its generated id. */
/**
 * An order before it exists.
 *
 * `id` is normally the store's to assign, and callers leave it out. It's offered
 * because checkout has to reference the order *before* creating it: stock is
 * claimed first (so an oversold order is never recorded), and each of those stock
 * movements is attributed to the order that took the units. Minting the id up
 * front is what lets that attribution be real rather than backfilled — an
 * append-only ledger shouldn't need a second write to say what it always meant.
 */
export type NewOrder = Omit<Order, "id" | "orderNumber"> & { id?: string };

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
    /**
     * The money's new standing, set in the same atomic write as the status. A
     * cancel or an approved return credits the wallet and so moves payment to
     * `refunded`; carrying it here rather than in a follow-up write is what keeps
     * the two from disagreeing — an order can't be lifecycle-`refunded` while its
     * payment still reads `paid`. Omitted (the common case) leaves it untouched.
     */
    paymentStatus?: PaymentStatus;
  };
};

export type IOrderRepository = {
  /** A user's orders, newest first. */
  getOrders(userId: string): Promise<Order[]>;

  /**
   * Every order, newest first.
   *
   * A whole-history read with exactly one caller left: `GetCustomerOrderSummaries`,
   * which groups the history by customer to build the spend ranking and has no
   * customers table to page instead. The dashboard's KPIs used to be the other
   * caller; they are aggregate SQL now (see `IAnalyticsRepository`), and nothing
   * reaches this over HTTP any more — `GET /api/admin/orders/all` was deleted with
   * them rather than left as a whole-table read anyone could pick up.
   *
   * It should not grow callers. The customer ranking is the next thing to move into
   * an aggregate query, at which point this method goes with it.
   */
  getAllOrders(): Promise<Order[]>;

  /** One page of the admin order list, plus the total matching the filters. */
  listPage(filters: AdminOrderFilters, page: PageRequest<AdminOrderSort>): Promise<Page<Order>>;

  /** A single order by id, or `null` when none matches. */
  getById(orderId: string): Promise<Order | null>;

  /**
   * Persist a newly placed order, returning it with its generated id.
   *
   * `audit` is passed only when a *person other than the customer* placed it — an
   * admin taking an order over the phone. Checkout leaves it off: the activity log
   * records what staff did, and every order in it having an entry that says
   * "placed by the customer" would bury the handful that didn't.
   */
  createOrder(input: NewOrder, audit?: AuditHook<Order>): Promise<Order>;

  /**
   * Apply a delivery-stage transition to an order, returning the updated order.
   * Throws `NotFoundError` when no order matches `orderId`.
   */
  setTrackingStage(orderId: string, update: OrderTrackingUpdate, audit?: AuditHook<Order>): Promise<Order>;

  /**
   * Atomically apply a guarded lifecycle transition (see {@link OrderStatusTransition}).
   * Returns the updated order when the `from` precondition matched, or `null`
   * when it didn't (unknown id, or the order had already moved on) — so a caller
   * that also moves money/stock only does so when it observes a real transition,
   * making cancel/return idempotent under double-submit and safe under races.
   */
  transitionStatus(
    orderId: string,
    transition: OrderStatusTransition,
    audit?: AuditHook<Order>,
  ): Promise<Order | null>;

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
    audit?: AuditHook<Order>,
  ): Promise<Order | null>;
}
