import { Check, Truck, PackageCheck, type LucideIcon } from "lucide-react";
import type { TrackingMilestone, TrackingStep, TrackingStepStatus } from "@/src/domain/entities/OrderTracking";
import { Icon } from "@/src/presentation/design-system";
import { formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";

/** Each milestone shows its own icon inside the step node. */
const MILESTONE_ICONS: Record<TrackingMilestone, LucideIcon> = {
  confirmed: Check,
  shipped: Truck,
  arrived: PackageCheck,
};

interface StepNodeProps {
  milestone: TrackingMilestone;
  status: TrackingStepStatus;
}

/**
 * A 32px node styled by the step's progress: a solid green disc for a `done`
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
        "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
        done && "border-primary bg-primary",
        current && "border-primary bg-background",
        status === "pending" && "border-icon-muted bg-background",
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
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.milestone} className="flex gap-3">
            <div className="flex flex-col items-center self-stretch">
              <StepNode milestone={step.milestone} status={step.status} />
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "my-1 w-0 flex-1 border-l-2",
                    step.status === "done" ? "border-solid border-primary" : "border-dashed border-icon-muted",
                  )}
                />
              )}
            </div>

            <div className={cn("flex flex-col gap-1", !isLast && "pb-6")}>
              <p className="text-body-b8 text-foreground">{step.label}</p>
              {step.occurredAt && (
                <p className="text-body-b10 text-icon-muted">{formatOrderTime(step.occurredAt)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
