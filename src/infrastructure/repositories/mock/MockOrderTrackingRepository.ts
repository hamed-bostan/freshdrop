import type {
  OrderTracking,
  TrackingMilestone,
  TrackingStep,
  TrackingStepStatus,
} from "@/src/domain/entities/OrderTracking";
import type { IOrderTrackingRepository, TrackingViewer } from "@/src/domain/repositories/IOrderTrackingRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { GeoPoint } from "@/src/domain/entities/Place";

/** Courier used for every tracked order in the mock. */
const RIDER = {
  name: "Joey Smith",
  role: "Delivery Man",
  avatarUrl: "/images/rider-avatar.png",
  phone: "+14165550123",
} as const;

// Fixed Toronto coordinates (around Queen's Park, matching the design) standing
// in for per-order geocoded points and a live courier feed. The route is a few
// hand-placed waypoints approximating a routing provider's road geometry.
const DESTINATION: GeoPoint = { latitude: 43.6629, longitude: -79.3925 };
const COURIER: GeoPoint = { latitude: 43.6566, longitude: -79.3852 };
const ROUTE: GeoPoint[] = [
  COURIER,
  { latitude: 43.6582, longitude: -79.3873 },
  { latitude: 43.66, longitude: -79.3894 },
  { latitude: 43.6617, longitude: -79.3911 },
  DESTINATION,
];

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
 * `pending` (with no timestamp yet).
 */
function buildSteps(stage: TrackingMilestone, placedAt: Date): TrackingStep[] {
  const stageIndex = TIMELINE.findIndex((step) => step.milestone === stage);

  return TIMELINE.map(({ milestone, label, offsetMs }, index) => {
    const status: TrackingStepStatus = index < stageIndex ? "done" : index === stageIndex ? "current" : "pending";
    const reached = index <= stageIndex;
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
    const steps = buildSteps(order.stage ?? "confirmed", new Date(order.placedAt));

    return {
      orderId: order.id,
      deliveryAddress: order.location,
      destination: DESTINATION,
      courier: COURIER,
      route: ROUTE,
      steps,
      rider: { ...RIDER },
    };
  }
}
