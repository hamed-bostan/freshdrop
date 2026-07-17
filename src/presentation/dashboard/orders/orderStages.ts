import type { Order } from "@/src/domain/entities/Order";
import type { TrackingMilestone, TrackingStep } from "@/src/domain/entities/OrderTracking";

/** The delivery milestones in order, keyed to their `dashOrders` stage labels. */
export const DELIVERY_STAGES = ["confirmed", "shipped", "arrived"] as const;

/** Translation key under `dashOrders` for each milestone's label. */
export const STAGE_LABEL_KEYS = {
  confirmed: "stageConfirmed",
  shipped: "stageShipped",
  arrived: "stageArrived",
} as const satisfies Record<TrackingMilestone, string>;

/** The stage `stage` advances to next, or `null` when it's already the last one. */
export function nextStage(stage: TrackingMilestone): TrackingMilestone | null {
  const index = DELIVERY_STAGES.indexOf(stage);
  return index >= 0 && index < DELIVERY_STAGES.length - 1 ? DELIVERY_STAGES[index + 1] : null;
}

/**
 * Whether an admin can still advance `order`'s delivery stage: it must be live and
 * in progress with a next milestone to move to (`arrived` flips it to `completed`
 * server-side, so it's never advanceable). Mirrors the list's trackable rule and
 * gates the detail page's "Advance" action.
 */
export function isAdvanceable(order: Order): boolean {
  return (
    order.phase === "current" &&
    order.status === "processing" &&
    order.stage !== undefined &&
    nextStage(order.stage) !== null
  );
}

/**
 * Derive the delivery timeline from an order's current stage/status — no tracking
 * fetch. A `completed` order has reached every milestone; a live one is `done`
 * before its stage, `current` at it, and `pending` after. Carries no `occurredAt`
 * (the admin view shows progress, not timestamps); reuses the storefront's
 * `TrackingStepper` for rendering.
 */
export function deliverySteps(order: Order): TrackingStep[] {
  const reached =
    order.status === "completed"
      ? DELIVERY_STAGES.length
      : DELIVERY_STAGES.indexOf(order.stage ?? "confirmed");
  return DELIVERY_STAGES.map((milestone, index) => ({
    milestone,
    status: index < reached ? "done" : index === reached ? "current" : "pending",
  }));
}
