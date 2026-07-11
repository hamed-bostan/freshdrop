import type {
  OrderTracking,
  TrackingMilestone,
  TrackingStep,
  TrackingStepStatus,
} from "@/src/domain/entities/OrderTracking";
import type { IOrderTrackingRepository, TrackingViewer } from "@/src/domain/repositories/IOrderTrackingRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { GeoPoint } from "@/src/domain/entities/Place";
import { pointAtFraction } from "@/src/lib/geo";

/** Courier used for every tracked order in the mock. */
const RIDER = {
  name: "Joey Smith",
  role: "Delivery Man",
  avatarUrl: "/images/rider-avatar.png",
  phone: "+14165550123",
} as const;

// Fixed Toronto coordinates (around Queen's Park, matching the design) standing
// in for per-order geocoded points. The route is a few hand-placed waypoints
// approximating a routing provider's road geometry; the courier is interpolated
// along it (see `simulateCourier`) as a stand-in for a live GPS feed.
const DESTINATION: GeoPoint = { latitude: 43.6629, longitude: -79.3925 };
const ROUTE_START: GeoPoint = { latitude: 43.6566, longitude: -79.3852 };
const ROUTE: GeoPoint[] = [
  ROUTE_START,
  { latitude: 43.6582, longitude: -79.3873 },
  { latitude: 43.66, longitude: -79.3894 },
  { latitude: 43.6617, longitude: -79.3911 },
  DESTINATION,
];

// Assumed door-to-door duration once an order is out for delivery. The mock has
// no recorded dispatch time (and seeded orders were "placed" long ago), so the
// courier cycles through a trip of this length off the wall clock: every poll
// shows it a little further along, with the ETA ticking down. A real feed
// replaces this with the courier's actual position and the provider's ETA.
const TRIP_DURATION_MS = 18 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

/** A stable per-order phase offset so concurrent deliveries aren't all in lockstep. */
function orderPhaseOffset(orderId: string): number {
  let hash = 0;
  for (let i = 0; i < orderId.length; i += 1) hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0;
  return hash % TRIP_DURATION_MS;
}

/**
 * The courier's live position and ETA for `stage`. Before dispatch it waits at
 * the route start with no ETA; once `arrived` it sits at the door; while
 * `shipped` it advances along the route from elapsed trip time.
 *
 * KNOWN MOCK CAVEAT — the trip is a wall-clock cycle (`now % TRIP_DURATION_MS`),
 * so a "shipped" order never truly finishes: every ~18 min the fraction wraps
 * 1 → 0 and the courier snaps from near the door back to the route start. On the
 * client that wrap is tweened as a one-off backward glide across the map. This is
 * an artifact of simulating movement without a recorded dispatch time (seeded
 * orders were "placed" long ago), and it disappears the moment a real GPS feed
 * replaces this function — see {@link IOrderTrackingRepository} and the binding
 * in `container.ts`. Do not build behaviour on top of the looping.
 */
function simulateCourier(
  orderId: string,
  stage: TrackingMilestone,
  now: number,
): { courier: GeoPoint; etaMinutes: number | null } {
  if (stage === "arrived") return { courier: DESTINATION, etaMinutes: null };
  if (stage !== "shipped") return { courier: ROUTE_START, etaMinutes: null };

  const elapsed = (now + orderPhaseOffset(orderId)) % TRIP_DURATION_MS;
  const fraction = elapsed / TRIP_DURATION_MS;
  const etaMinutes = Math.max(1, Math.ceil((TRIP_DURATION_MS - elapsed) / MS_PER_MINUTE));
  return { courier: pointAtFraction(ROUTE, fraction), etaMinutes };
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** The timeline, in order, with the human label and minutes-after-placement each milestone is reached. */
const TIMELINE: { milestone: TrackingMilestone; label: string; offsetMs: number }[] = [
  { milestone: "confirmed", label: "Order confirmed", offsetMs: 0 },
  { milestone: "shipped", label: "Order shipped", offsetMs: FIFTEEN_MINUTES_MS },
  { milestone: "arrived", label: "Order arrived", offsetMs: 3 * FIFTEEN_MINUTES_MS },
];

/**
 * Build the stepper from the order's current `stage`. Milestones before the stage
 * are `done`, the stage itself is the live `current` step, and later ones are
 * `pending` (with no timestamp yet). The one exception is the terminal milestone
 * (`arrived`): reaching it means the order is *delivered*, a completion rather
 * than an in-progress step, so it reads as `done` — the whole timeline fills in.
 */
function buildSteps(stage: TrackingMilestone, placedAt: Date): TrackingStep[] {
  const stageIndex = TIMELINE.findIndex((step) => step.milestone === stage);
  const lastIndex = TIMELINE.length - 1;

  return TIMELINE.map(({ milestone, label, offsetMs }, index) => {
    const reached = index <= stageIndex;
    const status: TrackingStepStatus = !reached
      ? "pending"
      : index < stageIndex || index === lastIndex
        ? "done"
        : "current";
    return {
      milestone,
      label,
      status,
      ...(reached ? { occurredAt: new Date(placedAt.getTime() + offsetMs).toISOString() } : {}),
    };
  });
}

/**
 * Resolves live tracking for an order. Depends on the order repository (not the
 * order store directly) so tracking stays decoupled from how orders are
 * persisted — Dependency Inversion, same as the rest of the composition root.
 *
 * Only "current" orders that haven't been cancelled are trackable; everything
 * else returns `null` so the route can 404. Tracking is scoped to the order's
 * owner (admins excepted) — another user's order reads as untrackable so its
 * existence isn't leaked.
 */
export class MockOrderTrackingRepository implements IOrderTrackingRepository {
  constructor(private readonly orders: IOrderRepository) {}

  async getByOrderId(orderId: string, viewer: TrackingViewer): Promise<OrderTracking | null> {
    const order = await this.orders.getById(orderId);

    if (!order || order.phase !== "current" || order.status === "cancelled") {
      return null;
    }

    if (!viewer.isAdmin && order.userId !== viewer.userId) {
      return null;
    }

    // Trackable orders always carry a stage (seeded in the order repo); default to
    // the first milestone if one is somehow missing.
    const stage = order.stage ?? "confirmed";
    const steps = buildSteps(stage, new Date(order.placedAt));
    const { courier, etaMinutes } = simulateCourier(order.id, stage, Date.now());

    return {
      orderId: order.id,
      deliveryAddress: order.location,
      destination: DESTINATION,
      courier,
      etaMinutes,
      route: ROUTE,
      steps,
      rider: { ...RIDER },
    };
  }
}
