import { Check, Truck, PackageCheck, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { TrackingMilestone, TrackingStep, TrackingStepStatus } from "@/src/domain/entities/OrderTracking";
import { formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";

/** Each milestone shows its own icon inside the step node. */
const MILESTONE_ICONS: Record<TrackingMilestone, LucideIcon> = {
  confirmed: Check,
  shipped: Truck,
  arrived: PackageCheck,
};

/** The milestone is the machine key; its copy is owned (and localized) here. */
const MILESTONE_LABEL_KEYS = {
  confirmed: "milestoneConfirmed",
  shipped: "milestoneShipped",
  arrived: "milestoneArrived",
} as const satisfies Record<TrackingMilestone, string>;

interface StepNodeProps {
  milestone: TrackingMilestone;
  status: TrackingStepStatus;
}

/**
 * A 40px node styled by the step's progress: a solid green disc for a `done`
 * milestone, a green ring highlighting the live `current` step, and a muted grey
 * ring for a `pending` one still ahead — so the milestone the order is actually
 * at never reads as inactive.
 */
function StepNode({ milestone, status }: StepNodeProps) {
  const done = status === "done";
  const current = status === "current";
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
        done && "border-primary bg-primary",
        current && "border-primary bg-primary/10 ring-4 ring-primary/5",
        status === "pending" && "border-border bg-surface",
      )}
    >
      <Icon
        icon={MILESTONE_ICONS[milestone]}
        size="sm"
        className={cn(
          done && "text-primary-foreground",
          current && "text-primary",
          status === "pending" && "text-icon-muted",
        )}
      />
    </span>
  );
}

interface TrackingStepperProps {
  steps: TrackingStep[];
}

/**
 * Vertical timeline of delivery milestones. Each step is a node plus its label;
 * the connector below a *done* step is solid green, otherwise a dashed grey
 * line, mirroring how far the order has progressed.
 */
export function TrackingStepper({ steps }: TrackingStepperProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.milestone}
            aria-current={step.status === "current" ? "step" : undefined}
            className={cn("flex gap-4", !isLast && "min-h-24")}
          >
            <div className="flex flex-col items-center self-stretch">
              <StepNode milestone={step.milestone} status={step.status} />
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "my-2 w-0 flex-1 border-s-2",
                    step.status === "done" ? "border-solid border-primary" : "border-dashed border-border",
                  )}
                />
              )}
            </div>

            <div className={cn("flex min-h-10 flex-col justify-center gap-1.5", !isLast && "justify-start pt-2 pb-8")}>
              <p className={cn("text-body-b8", step.status === "pending" ? "text-muted-foreground" : "text-foreground")}>
                {t(MILESTONE_LABEL_KEYS[step.milestone])}
              </p>
              {step.occurredAt && (
                <p className="text-body-b10 text-muted-foreground">{formatOrderTime(step.occurredAt, locale)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
