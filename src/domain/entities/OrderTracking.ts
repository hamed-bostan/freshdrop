import type { GeoPoint } from "./Place";

/** A milestone in the delivery lifecycle — drives the icon shown on the tracker. */
export type TrackingMilestone = "confirmed" | "shipped" | "arrived";

/**
 * Progress of a single milestone. `done` is reached, `current` is in progress
 * (the live step), `pending` is not yet started. Drives both the step icon
 * styling and the connector line below it.
 */
export type TrackingStepStatus = "done" | "current" | "pending";

/** A single step in the order's delivery timeline. */
export interface TrackingStep {
  milestone: TrackingMilestone;
  /** Human-readable label, e.g. "Order shipped". */
  label: string;
  /** ISO 8601 timestamp (UTC) the step was reached. Absent while pending. */
  occurredAt?: string;
  status: TrackingStepStatus;
}

/** The courier delivering the order. */
export interface DeliveryRider {
  name: string;
  /** Job title shown under the name, e.g. "Delivery Man". */
  role: string;
  avatarUrl: string;
  /** E.164 phone number used for the call action. */
  phone: string;
}

/** Live tracking detail for a placed order, shown on the "Order Track" screen. */
export interface OrderTracking {
  orderId: string;
  /** Human-readable delivery address. */
  deliveryAddress: string;
  /** The delivery destination coordinate. */
  destination: GeoPoint;
  /**
   * The courier's current position. In production this is fed by a realtime
   * channel (websocket / polling) and changes over the life of the delivery;
   * the mock supplies a fixed point.
   */
  courier: GeoPoint;
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
