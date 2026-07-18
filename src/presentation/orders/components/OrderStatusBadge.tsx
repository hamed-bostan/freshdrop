import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { Badge, type BadgeProps } from "@/src/presentation/design-system";

/**
 * The visual tone of the status pill, named for what it means to an order rather
 * than for its colour, then mapped onto a design-system Badge tone below:
 * `progress` is the happy path still in flight, `success` a delivered/refunded
 * terminal state, `warning` an open return awaiting the admin, `error` a
 * cancellation.
 */
type BadgeTone = "success" | "progress" | "warning" | "error";

/**
 * Order tone → Badge tone. `success` maps to the brand green (`primary`) rather
 * than the Badge's own `success` tint, because a delivered order should read in
 * the same green as the rest of the storefront.
 */
const TONE_VARIANT = {
  success: "primary",
  progress: "info",
  warning: "warning",
  error: "error",
} as const satisfies Record<BadgeTone, BadgeProps["variant"]>;

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
    <Badge
      variant={TONE_VARIANT[tone]}
      // The storefront pill is an outline over the tint; the admin pill is a solid tint.
      appearance={context === "storefront" ? "outline" : "solid"}
      size="md"
    >
      {t(labelKey)}
    </Badge>
  );
}
