import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { cn } from "@/src/lib/utils";

/**
 * The visual tone of the status pill. `progress` (info blue) is the happy path
 * still in flight, `success` (brand green) a delivered/refunded terminal state,
 * `warning` (amber) an open return awaiting the admin, `error` (red) a cancellation.
 */
type BadgeTone = "success" | "progress" | "warning" | "error";

/** Fill (tint background + matching text) per tone — shared by both contexts. */
const TONE_FILL: Record<BadgeTone, string> = {
  success: "bg-accent text-primary",
  progress: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-error text-error-foreground",
};

/** Border colour per tone — only the storefront pill draws an outline. */
const TONE_BORDER: Record<BadgeTone, string> = {
  success: "border-primary",
  progress: "border-info-foreground",
  warning: "border-warning-foreground",
  error: "border-error-foreground",
};

/** Translation key under the `orders` namespace for the pill's label. */
type BadgeLabelKey =
  | "statusDelivered"
  | "statusCancelled"
  | "statusReturnRequested"
  | "statusRefunded"
  | "statusShipped"
  | "statusConfirmed"
  | "statusInProgress";

type BadgeDisplay = { labelKey: BadgeLabelKey; tone: BadgeTone };

/**
 * Where the pill renders, which changes how a live order reads:
 * - `storefront` (default) — the customer's own order view. A `processing` order
 *   shows its precise delivery milestone ("Confirmed", then "Shipped") so the
 *   status matches the tracker beside it, and an open return keeps the neutral
 *   in-flight (blue) tone.
 * - `admin` — the dashboard. A `processing` order reads as a single coarse
 *   "In progress" (the precise stage lives in the detail tracker), and an open
 *   return is flagged amber as an item needing action.
 */
type BadgeContext = "storefront" | "admin";

/**
 * Reconcile an order's coarse lifecycle `status` with its fine-grained delivery
 * `stage` into the single label + tone the pill shows. The stage-independent
 * outcomes (delivered, cancelled, return, refund) come straight from `status`;
 * only a live `processing` order differs by context (see {@link BadgeContext}).
 */
function statusDisplay(status: OrderStatus, stage: TrackingMilestone | undefined, context: BadgeContext): BadgeDisplay {
  switch (status) {
    case "completed":
      return { labelKey: "statusDelivered", tone: "success" };
    case "cancelled":
      return { labelKey: "statusCancelled", tone: "error" };
    case "return_requested":
      return { labelKey: "statusReturnRequested", tone: context === "admin" ? "warning" : "progress" };
    case "refunded":
      return { labelKey: "statusRefunded", tone: "success" };
    case "processing":
      // Admin reads this as one coarse "In progress"; the storefront shows the
      // precise milestone. `arrived` flips the status to `completed`, so
      // `processing` only ever covers confirmed/shipped; a missing stage
      // (shouldn't happen while live) falls back to "Confirmed".
      if (context === "admin") return { labelKey: "statusInProgress", tone: "progress" };
      return stage === "shipped"
        ? { labelKey: "statusShipped", tone: "progress" }
        : { labelKey: "statusConfirmed", tone: "progress" };
  }
}

type OrderStatusBadgeProps = {
  status: OrderStatus;
  /** The delivery milestone — gives a live (`processing`) storefront order a precise label. */
  stage?: TrackingMilestone;
  /** Rendering context; defaults to the customer-facing storefront pill. */
  context?: BadgeContext;
};

export function OrderStatusBadge({ status, stage, context = "storefront" }: OrderStatusBadgeProps) {
  const t = useTranslations("orders");
  const { labelKey, tone } = statusDisplay(status, stage, context);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge-lg px-4 py-2 text-body-b10",
        TONE_FILL[tone],
        // The storefront pill is an outline over the tint; the admin pill is a solid tint.
        context === "storefront" && cn("border", TONE_BORDER[tone]),
      )}
    >
      {t(labelKey)}
    </span>
  );
}
