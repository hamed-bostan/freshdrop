import type { OrderStatus } from "./Order";
import type { TrackingMilestone } from "./OrderTracking";

/**
 * One lifecycle transition an order went through — `processing → completed`, a
 * stage advance, and so on.
 *
 * Written by `PrismaOrderRepository.transitionStatus`/`setTrackingStage`
 * themselves, in the same transaction as the change, so every caller is
 * covered without having to remember to record one — including
 * customer-initiated moves (`CancelOrder`, `RequestOrderReturn`) the admin
 * activity log never captured. This is the record that makes "when was this
 * order actually delivered" an answered question instead of a guess at
 * `updatedAt`, which any later edit to the order would silently move.
 */
export type OrderStatusEvent = {
  id: string;
  orderId: string;
  /** Absent when the prior state isn't known — the introducing migration's backfill. */
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  fromStage?: TrackingMilestone;
  toStage?: TrackingMilestone;
  /** Who caused it — absent for a transition the customer triggered themselves. */
  actorId?: string;
  /** The actor's display name, snapshotted at write time (see `Refund.actorName`). */
  actorName?: string;
  /**
   * Free text, except for the sentinel `"backfill"` — reporting that wants
   * only recorded, not reconstructed, history can filter those out.
   */
  reason?: string;
  /** ISO 8601 timestamp (UTC). Formatted in the presentation layer. */
  occurredAt: string;
};

/** The `"backfill"` sentinel a synthesized event's `reason` carries. See {@link OrderStatusEvent}. */
export const BACKFILLED_STATUS_EVENT_REASON = "backfill";
