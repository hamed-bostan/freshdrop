import type { OrderTracking } from "../entities/OrderTracking";

/**
 * Who is asking for tracking. Orders are user data, so tracking is scoped to the
 * owner; admins (the dashboard) may view any order. The repository treats an
 * order the viewer may not see as untrackable (`null`) so its existence isn't
 * leaked to other signed-in users.
 */
export type TrackingViewer = {
  /** The signed-in caller's user id. */
  userId: string;
  /** True for an allowlisted admin — bypasses the ownership check. */
  isAdmin: boolean;
};

/**
 * Live delivery tracking for an order.
 *
 * The port is deliberately provider-agnostic: callers (route handler, client
 * polling hook, map) read a plain {@link OrderTracking} snapshot and never learn
 * where it came from. A production adapter is expected to source, per read:
 *   - `courier` from a realtime GPS / telematics feed,
 *   - `route` (road-following geometry) and `etaMinutes` from a routing provider
 *     (e.g. Google Directions, Mapbox) — both typically paid services,
 *   - `destination`/`rider` from the order and courier assignment records.
 *
 * The shipped implementation is {@link MockOrderTrackingRepository}, which
 * simulates the courier/ETA off a synthetic clock; swapping to a real adapter is
 * a one-line change in the composition root and requires no caller changes.
 */
export type IOrderTrackingRepository = {
  /**
   * Live tracking for an order the `viewer` is allowed to see, or `null` if the
   * order can't be tracked or isn't theirs.
   *
   * Callers poll this while a delivery is en route, so an adapter must return a
   * *fresh* snapshot on every call (the courier position and `etaMinutes` are
   * expected to advance between reads) and must not cache stale spatial data.
   */
  getByOrderId(orderId: string, viewer: TrackingViewer): Promise<OrderTracking | null>;
}
