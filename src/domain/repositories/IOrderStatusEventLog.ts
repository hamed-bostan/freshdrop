import type { OrderStatusEvent } from "../entities/OrderStatusEvent";

/** An event about to be written. The id is the repository's to assign. */
export type NewOrderStatusEvent = Omit<OrderStatusEvent, "id">;

/**
 * The order status event ledger. Deliberately two methods and no update, no
 * delete — the same reasoning `IRefundRepository` and `IOrderNoteRepository`
 * are built on: a transition is a record of something that happened, and one
 * that could be revised afterwards isn't a record.
 *
 * `record` is called from inside `PrismaOrderRepository`'s own transaction
 * (`transitionStatus`/`setTrackingStage`), not by use-cases — every status or
 * stage move is covered automatically, the same arrangement `recordAudit`
 * uses for the activity log.
 */
export type IOrderStatusEventLog = {
  /** One order's transition history, oldest first. */
  listForOrder(orderId: string): Promise<OrderStatusEvent[]>;
  /** Append a transition, returning it with its assigned id. */
  record(event: NewOrderStatusEvent): Promise<OrderStatusEvent>;
};
