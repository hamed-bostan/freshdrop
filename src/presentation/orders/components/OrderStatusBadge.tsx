import type { OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { cn } from "@/src/lib/utils";

/**
 * The visual tone of the status pill — a coloured outline over a matching tint.
 * `progress` (info blue) is the happy path still in flight, `success` (brand
 * green) a delivered/refunded terminal state, `error` (red) a cancellation.
 */
type BadgeTone = "success" | "progress" | "error";

const TONE_STYLES: Record<BadgeTone, string> = {
  success: "border-primary text-primary bg-accent",
  progress: "border-info-foreground text-info-foreground bg-info",
  error: "border-error-foreground text-error-foreground bg-error",
};

type BadgeDisplay = { label: string; tone: BadgeTone };

/**
 * Reconcile an order's coarse lifecycle `status` with its fine-grained delivery
 * `stage` into the single label + tone the pill shows. `processing` is an
 * internal umbrella — never surfaced verbatim — so a live order reads as its
 * actual milestone ("Confirmed" while being prepared, "Shipped" once out for
 * delivery) instead of a vague "Processing" that contradicts the stage control
 * beside it on the dashboard. The stage-independent outcomes (delivered,
 * cancelled, return, refund) come straight from `status`.
 */
function statusDisplay(status: OrderStatus, stage?: TrackingMilestone): BadgeDisplay {
  switch (status) {
    case "completed":
      return { label: "Delivered", tone: "success" };
    case "cancelled":
      return { label: "Cancelled", tone: "error" };
    case "return_requested":
      return { label: "Return requested", tone: "progress" };
    case "refunded":
      return { label: "Refunded", tone: "success" };
    case "processing":
      // Live order — show the delivery milestone. `arrived` flips the status to
      // `completed`, so `processing` only ever covers confirmed/shipped; a
      // missing stage (shouldn't happen while live) falls back to "Confirmed".
      return stage === "shipped"
        ? { label: "Shipped", tone: "progress" }
        : { label: "Confirmed", tone: "progress" };
  }
}

type OrderStatusBadgeProps = {
  status: OrderStatus;
  /** The delivery milestone — gives a live (`processing`) order a precise label. */
  stage?: TrackingMilestone;
};

export function OrderStatusBadge({ status, stage }: OrderStatusBadgeProps) {
  const { label, tone } = statusDisplay(status, stage);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge-lg border px-4 py-2",
        "text-body-b10",
        TONE_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}
