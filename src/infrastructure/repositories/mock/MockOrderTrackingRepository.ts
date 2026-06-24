import type { OrderTracking, TrackingStep } from "@/src/domain/entities/OrderTracking";
import type { IOrderTrackingRepository } from "@/src/domain/repositories/IOrderTrackingRepository";
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

/**
 * Resolves live tracking for an order. Depends on the order repository (not the
 * order store directly) so tracking stays decoupled from how orders are
 * persisted — Dependency Inversion, same as the rest of the composition root.
 *
 * Only "current" orders that haven't been cancelled are trackable; everything
 * else returns `null` so the route can 404.
 */
export class MockOrderTrackingRepository implements IOrderTrackingRepository {
  constructor(private readonly orders: IOrderRepository) {}

  async getByOrderId(orderId: string): Promise<OrderTracking | null> {
    const all = await this.orders.getOrders();
    const order = all.find((candidate) => candidate.id === orderId);

    if (!order || order.phase !== "current" || order.status === "cancelled") {
      return null;
    }

    const placedAt = new Date(order.placedAt);
    const shippedAt = new Date(placedAt.getTime() + FIFTEEN_MINUTES_MS);

    const steps: TrackingStep[] = [
      {
        milestone: "confirmed",
        label: "Order confirmed",
        occurredAt: placedAt.toISOString(),
        status: "done",
      },
      {
        milestone: "shipped",
        label: "Order shipped",
        occurredAt: shippedAt.toISOString(),
        status: "current",
      },
      {
        milestone: "arrived",
        label: "Order arrived",
        status: "pending",
      },
    ];

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
