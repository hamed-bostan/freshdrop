import { useTranslations } from "next-intl";
import { Bike, PackageCheck, Clock, type LucideIcon } from "lucide-react";
import type { TrackingMilestone, TrackingStep } from "@/src/domain/entities/OrderTracking";
import { Icon } from "@/src/presentation/design-system";

/**
 * The milestone the order has most recently reached — the live `current` step
 * while in flight, or the final `done` step once delivered (an arrived order has
 * no `current` step). Walks the ordered timeline and keeps the last non-pending
 * one, so the banner tracks the furthest progress either way.
 */
function activeMilestone(steps: TrackingStep[]): TrackingMilestone | undefined {
  return steps.reduce<TrackingMilestone | undefined>(
    (reached, step) => (step.status === "pending" ? reached : step.milestone),
    undefined,
  );
}

/** Icon + `live` flag for the banner, keyed off where the delivery is right now. */
function bannerVisual(
  milestone: TrackingMilestone | undefined,
  etaMinutes: number | null,
): { icon: LucideIcon; live: boolean } {
  if (milestone === "arrived") return { icon: PackageCheck, live: false };
  if (milestone === "shipped" && etaMinutes !== null) return { icon: Bike, live: true };
  return { icon: Clock, live: false };
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
  const t = useTranslations("orders");
  const milestone = activeMilestone(steps);
  const { icon, live } = bannerVisual(milestone, etaMinutes);

  // Same branch order as `bannerVisual`, so the copy always matches the icon/flag.
  const title =
    milestone === "arrived"
      ? t("courierArrived")
      : milestone === "shipped" && etaMinutes !== null
        ? t("arrivingIn", { count: etaMinutes })
        : t("preparing");

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
            {t("liveTracking")}
          </span>
        )}
      </div>
    </div>
  );
}
