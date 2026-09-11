/**
 * Service-level thresholds for the order queue — how long an order may sit
 * before it counts as something an operator should look at.
 *
 * Both are read off `placedAt` rather than a per-stage timestamp, because
 * that's the only instant the domain actually records: there's no
 * entered-this-stage column, so "stuck in `confirmed`" can't be told apart
 * from "just confirmed a minute ago" without one. `placedAt` has no such
 * ambiguity for the two cases these back:
 *
 *  - an order still at `pending` (nobody has confirmed it) has been in that
 *    stage for its *entire* life, so its age since placement *is* its time
 *    in stage — {@link PENDING_ORDER_SLA_HOURS} is sound;
 *  - "still not delivered" is a claim about the whole order regardless of
 *    which milestone it's currently at, so age since placement is exactly
 *    the right measure — {@link UNFULFILLED_ORDER_SLA_HOURS} needs nothing
 *    more precise.
 *
 * A breach further along the pipeline (confirmed for too long without
 * shipping, say) would need that missing timestamp to state honestly, so it
 * isn't offered here rather than approximated from a proxy that would drift.
 */

/** Placed but not yet confirmed for this long — the front of the queue stalling. */
export const PENDING_ORDER_SLA_HOURS = 2;

/** Still not delivered this long after being placed, whatever stage it's at. */
export const UNFULFILLED_ORDER_SLA_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

/** The instant `hours` before `now` — orders placed earlier than this have breached that threshold. */
export function slaCutoff(hours: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - hours * HOUR_MS);
}
