import type { OrderStatus } from "./Order";
import type { TrackingMilestone } from "./OrderTracking";

/**
 * The order list's status vocabulary *as an operator thinks about it* — one flat
 * list of "where is this order right now", rather than the two fields the domain
 * actually stores.
 *
 * The split exists because `status` and `stage` answer different questions:
 * `status` is the lifecycle outcome (is this order live, called off, refunded)
 * and `stage` is how far along the delivery got. Nobody working the queue thinks
 * in those terms — they think "which orders haven't been confirmed yet" and
 * "which are on a van". Those are *combinations*, so a filter offering `status`
 * alone can't express them: `processing` covers both an order nobody has looked
 * at and one that's minutes from the door.
 *
 * So this is the presentation vocabulary, resolved in the repository rather than
 * in the UI: each stage maps to a `status` (+ optionally a `stage`) predicate
 * that the query can be built from, which keeps the paging honest — filtering
 * after the fact would page a set the count doesn't agree with.
 *
 * The list is deliberately only what the domain can currently distinguish.
 * "Preparing" and "Ready" are real steps in a grocery back-of-house, but
 * `TrackingMilestone` has no milestones for them, so offering them would be a
 * filter that silently matches nothing. They arrive when the milestone does.
 */
export const ORDER_PIPELINE_STAGES = [
  "in_progress",
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "return_requested",
  "cancelled",
  "refunded",
] as const;

export type OrderPipelineStage = (typeof ORDER_PIPELINE_STAGES)[number];

/**
 * The `(status, stage)` predicate a pipeline stage selects.
 *
 * `stage: null` means "the stage column is unset" (an order nobody has confirmed
 * yet), which is a different query from `stage: undefined` — "any stage, don't
 * constrain it" — and the distinction is the whole reason `pending` and
 * `confirmed` can be told apart.
 */
export type OrderPipelinePredicate = {
  status: OrderStatus;
  stage?: TrackingMilestone | null;
};

const PIPELINE_PREDICATES: Record<OrderPipelineStage, OrderPipelinePredicate> = {
  // Every live order, whatever milestone it's reached — the umbrella over the
  // three below it. Deliberately overlapping rather than mutually exclusive: "how
  // much is in flight right now" is the question the queue is opened with, and
  // answering it by ticking three boxes is worse than one option that says so.
  in_progress: { status: "processing" },
  // Placed, but nobody has accepted it yet — the top of the work queue.
  pending: { status: "processing", stage: null },
  // Accepted and being put together; still in the store's hands.
  confirmed: { status: "processing", stage: "confirmed" },
  // With a courier, on the way to the customer.
  out_for_delivery: { status: "processing", stage: "shipped" },
  // Handed over. `status` alone settles it — an order only completes by arriving,
  // so constraining the stage as well would just exclude legacy rows that
  // completed before milestones were recorded.
  delivered: { status: "completed" },
  return_requested: { status: "return_requested" },
  cancelled: { status: "cancelled" },
  refunded: { status: "refunded" },
};

/** The `(status, stage)` predicate a pipeline stage filters on. */
export function pipelinePredicate(stage: OrderPipelineStage): OrderPipelinePredicate {
  return PIPELINE_PREDICATES[stage];
}

/**
 * Fold `(status, stage)` group counts into a count per pipeline stage.
 *
 * Done here rather than in SQL because the stages are not a partition: a
 * `processing` order at `shipped` is counted under both `out_for_delivery` and
 * the `in_progress` umbrella, and no `GROUP BY` row can be in two groups at once.
 * Evaluating each stage's predicate against each group is also what keeps the
 * counts and the filters honest — both read the same predicates, so a count can't
 * promise a number the filter behind it then fails to show.
 *
 * Every stage is present, including the ones nothing is in: a filter option
 * labelled "0" is information, while a missing one looks like a bug.
 */
export function pipelineCounts(
  groups: readonly { status: OrderStatus; stage: TrackingMilestone | null; orders: number }[],
): Record<OrderPipelineStage, number> {
  const counts = Object.fromEntries(ORDER_PIPELINE_STAGES.map((stage) => [stage, 0])) as Record<
    OrderPipelineStage,
    number
  >;

  for (const group of groups) {
    for (const stage of ORDER_PIPELINE_STAGES) {
      const predicate = PIPELINE_PREDICATES[stage];
      if (predicate.status !== group.status) continue;
      // `undefined` leaves the milestone unconstrained; `null` means specifically
      // "no milestone set" — the distinction that separates pending from confirmed.
      if (predicate.stage !== undefined && predicate.stage !== group.stage) continue;
      counts[stage] += group.orders;
    }
  }

  return counts;
}

/**
 * Which pipeline stage an order presents as — a near-inverse of the predicates
 * above, for labelling a row.
 *
 * Never returns `in_progress`: that stage exists to be *asked for*, and a row
 * labelled with the umbrella instead of the milestone it actually reached would
 * be telling an operator less than the data knows. It is the one stage that
 * filters but doesn't label, which is why this isn't a true inverse.
 *
 * Ordered most-specific-first so a live order resolves by its milestone and
 * every terminal status short-circuits before that. An unexpected pairing (a
 * `processing` order at `arrived`, which the stage-advance use-case moves to
 * `completed` in the same write) falls back to `confirmed`: the order is with
 * the store, which is the safe thing to tell an operator.
 */
export function orderPipelineStage(order: {
  status: OrderStatus;
  stage?: TrackingMilestone;
}): OrderPipelineStage {
  switch (order.status) {
    case "completed":
      return "delivered";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "return_requested":
      return "return_requested";
    case "processing":
      if (order.stage == null) return "pending";
      return order.stage === "shipped" ? "out_for_delivery" : "confirmed";
  }
}
