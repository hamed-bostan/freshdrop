import { getTranslations } from "next-intl/server";
import type { TrackingStep } from "@/src/domain/entities/OrderTracking";
import { cn } from "@/src/lib/utils";
import { STAGE_LABEL_KEYS } from "./orderStages";

type OrderDeliveryTrackerProps = {
  /** Delivery milestones in order, each already flagged done / current / pending. */
  steps: TrackingStep[];
};

/**
 * Horizontal delivery tracker for the admin order-detail page: a numbered node per
 * milestone joined by connector rails — green once reached, grey while still ahead.
 * Distinct from the storefront's vertical {@link TrackingStepper}; the admin view
 * labels milestones with the terse dashboard stage names (Confirmed/Shipped/Arrived)
 * and shows progress, not timestamps.
 */
export async function OrderDeliveryTracker({ steps }: OrderDeliveryTrackerProps) {
  const t = await getTranslations("dashOrders");

  return (
    <ol className="flex items-start">
      {steps.map((step, index) => {
        const reached = step.status !== "pending";
        const isLast = index === steps.length - 1;
        // The rail to the next node is only "travelled" once that node is reached.
        const nextReached = !isLast && steps[index + 1].status !== "pending";

        return (
          <li key={step.milestone} className={cn("flex flex-col gap-2", !isLast && "flex-1")}>
            <div className="flex items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-body-b9",
                  reached ? "bg-primary text-primary-foreground" : "bg-surface-sunken text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn("mx-2 h-0.5 flex-1 rounded-full", nextReached ? "bg-primary" : "bg-border")}
                />
              ) : null}
            </div>
            <span className={cn("text-body-b8", reached ? "text-foreground" : "text-muted-foreground")}>
              {t(STAGE_LABEL_KEYS[step.milestone])}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
