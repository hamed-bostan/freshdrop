import { Bike, PackageCheck, Clock, type LucideIcon } from "lucide-react";
import type { TrackingMilestone, TrackingStep } from "@/src/domain/entities/OrderTracking";
import { Icon } from "@/src/presentation/design-system";

/** The milestone the order is currently at (the live step), if any. */
function currentMilestone(steps: TrackingStep[]): TrackingMilestone | undefined {
  return steps.find((step) => step.status === "current")?.milestone;
}

/** Copy + icon for the banner, keyed off where the delivery is right now. */
function bannerContent(
  milestone: TrackingMilestone | undefined,
  etaMinutes: number | null,
): { icon: LucideIcon; title: string; live: boolean } {
  if (milestone === "arrived") {
    return { icon: PackageCheck, title: "Your courier has arrived", live: false };
  }
  if (milestone === "shipped" && etaMinutes !== null) {
    const unit = etaMinutes === 1 ? "min" : "mins";
    return { icon: Bike, title: `Arriving in about ${etaMinutes} ${unit}`, live: true };
  }
  return { icon: Clock, title: "Preparing your order", live: false };
}

interface TrackingEtaProps {
  etaMinutes: number | null;
  steps: TrackingStep[];
}

/**
 * The headline delivery status above the map: a live, ticking ETA while the
 * courier is en route, or a preparing/arrived message otherwise.
 */
export function TrackingEta({ etaMinutes, steps }: TrackingEtaProps) {
  const { icon, title, live } = bannerContent(currentMilestone(steps), etaMinutes);

  return (
    <div className="flex items-center gap-3 rounded-card-xl bg-surface p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon icon={icon} size="md" className="text-primary" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-body-b7 text-foreground">{title}</p>
        {live && (
          <span className="flex items-center gap-1.5 text-body-b10 text-muted-foreground">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-primary" />
            Live tracking
          </span>
        )}
      </div>
    </div>
  );
}
