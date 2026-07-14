import type { GeoPoint } from "./Place";

/** A milestone in the delivery lifecycle — drives the icon shown on the tracker. */
export type TrackingMilestone = "confirmed" | "shipped" | "arrived";

/**
 * Progress of a single milestone. `done` is reached, `current` is in progress
 * (the live step), `pending` is not yet started. Drives both the step icon
 * styling and the connector line below it.
 */
export type TrackingStepStatus = "done" | "current" | "pending";

/**
 * A single step in the order's delivery timeline. Carries no display copy: the
 * `milestone` is the machine key the presentation layer localizes off.
 */
export type TrackingStep = {
  milestone: TrackingMilestone;
  /** ISO 8601 timestamp (UTC) the step was reached. Absent while pending. */
  occurredAt?: string;
  status: TrackingStepStatus;
}

/** The courier delivering the order. The job title shown under the name is UI copy, not data. */
export type DeliveryRider = {
  name: string;
  avatarUrl: string;
  /** E.164 phone number used for the call action. */
  phone: string;
}

/** Live tracking detail for a placed order, shown on the "Order Track" screen. */
export type OrderTracking = {
  orderId: string;
  /** Human-readable delivery address. */
  deliveryAddress: string;
  /** The delivery destination coordinate. */
  destination: GeoPoint;
  /**
   * The courier's current position. Changes over the life of the delivery: fed
   * by a realtime GPS channel in production, and interpolated along the route
   * from elapsed trip time in the mock. Clients poll for it and glide the map
   * marker between updates.
   */
  courier: GeoPoint;
  /**
   * Minutes until the courier reaches the destination, or `null` when there's no
   * live estimate — before dispatch (`confirmed`) and once `arrived`. Derived
   * from the courier's remaining distance along the route.
   */
  etaMinutes: number | null;
  /**
   * Path drawn from the courier to the destination. A road-following geometry
   * from a routing provider in production; an approximating set of waypoints in
   * the mock. Empty falls back to a straight courier→destination line.
   */
  route: GeoPoint[];
  /** Ordered timeline, earliest milestone first. */
  steps: TrackingStep[];
  rider: DeliveryRider;
}
