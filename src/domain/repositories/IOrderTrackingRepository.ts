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

export type IOrderTrackingRepository = {
  /**
   * Live tracking for an order the `viewer` is allowed to see, or `null` if the
   * order can't be tracked or isn't theirs.
   */
  getByOrderId(orderId: string, viewer: TrackingViewer): Promise<OrderTracking | null>;
}
