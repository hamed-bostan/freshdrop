/**
 * The delivery window a shopper chose can no longer be booked when the order is
 * placed — it filled up (raced another order, or the last unit went since the
 * checkout screen loaded) or the choice doesn't resolve to a real, in-horizon
 * window. Thrown by the order use-case; the presentation layer maps it to 409
 * Conflict. `message` is shopper-facing.
 */
export class SlotUnavailableError extends Error {
  constructor(
    /** A user-presentable explanation, e.g. `"Tomorrow 6:00 – 8:00 PM is fully booked."` */
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "SlotUnavailableError";
  }
}
