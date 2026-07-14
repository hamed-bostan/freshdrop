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
  avatarUrl: "/images/rider-avatar.png",
  phone: "+14165550123",
} as const;

// Where the delivery is headed: the coordinate snapshotted onto the order at
// checkout. Orders placed before that was recorded (and addresses saved without a
// picked point) have none, so they fall back to the design's Toronto coordinates
// (around Queen's Park) — the map still renders, just not at their real address.
const FALLBACK_DESTINATION: GeoPoint = { latitude: 43.6629, longitude: -79.3925 };

// The courier sets off from a fixed offset southeast of the destination (~800m),
// so every order gets a plausible approach without a routing provider. The route
// itself is a straight line sampled into waypoints, standing in for a provider's
// road geometry; the courier is interpolated along it (see `simulateCourier`) as a
// stand-in for a live GPS feed.
const APPROACH_OFFSET: GeoPoint = { latitude: -0.0063, longitude: 0.0073 };
const ROUTE_WAYPOINTS = 4;

/** The courier's straight-line approach to `destination`, sampled into waypoints. */
function buildRoute(destination: GeoPoint): GeoPoint[] {
  const start: GeoPoint = {
    latitude: destination.latitude + APPROACH_OFFSET.latitude,
    longitude: destination.longitude + APPROACH_OFFSET.longitude,
  };
  return Array.from({ length: ROUTE_WAYPOINTS + 1 }, (_, index) => {
    const fraction = index / ROUTE_WAYPOINTS;
    return {
      latitude: start.latitude + (destination.latitude - start.latitude) * fraction,
      longitude: start.longitude + (destination.longitude - start.longitude) * fraction,
    };
  });
}

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
  route: GeoPoint[],
): { courier: GeoPoint; etaMinutes: number | null } {
  if (stage === "arrived") return { courier: route[route.length - 1], etaMinutes: null };
  if (stage !== "shipped") return { courier: route[0], etaMinutes: null };

  const elapsed = (now + orderPhaseOffset(orderId)) % TRIP_DURATION_MS;
  const fraction = elapsed / TRIP_DURATION_MS;
  const etaMinutes = Math.max(1, Math.ceil((TRIP_DURATION_MS - elapsed) / MS_PER_MINUTE));
  return { courier: pointAtFraction(route, fraction), etaMinutes };
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** The timeline, in order, with the minutes-after-placement each milestone is reached. */
const TIMELINE: { milestone: TrackingMilestone; offsetMs: number }[] = [
  { milestone: "confirmed", offsetMs: 0 },
  { milestone: "shipped", offsetMs: FIFTEEN_MINUTES_MS },
  { milestone: "arrived", offsetMs: 3 * FIFTEEN_MINUTES_MS },
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

  return TIMELINE.map(({ milestone, offsetMs }, index) => {
    const reached = index <= stageIndex;
    const status: TrackingStepStatus = !reached
      ? "pending"
      : index < stageIndex || index === lastIndex
        ? "done"
        : "current";
    return {
      milestone,
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
    const destination = order.destination ?? FALLBACK_DESTINATION;
    const route = buildRoute(destination);
    const { courier, etaMinutes } = simulateCourier(order.id, stage, Date.now(), route);

    return {
      orderId: order.id,
      deliveryAddress: order.location,
      destination,
      courier,
      etaMinutes,
      route,
      steps,
      rider: { ...RIDER },
    };
  }
}
