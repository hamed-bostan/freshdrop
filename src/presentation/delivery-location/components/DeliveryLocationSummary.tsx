import { Home, Building2, Dumbbell, MapPin, type LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";

const KIND_ICON: Record<DeliveryLocationKind, LucideIcon> = {
  home: Home,
  office: Building2,
  gym: Dumbbell,
  other: MapPin,
};

interface DeliveryLocationSummaryProps {
  location: DeliveryLocation;
}

/**
 * Kind icon + label + one-line (truncated) address. The shared display block for
 * a saved delivery location — used by the selector sheet and the manage screen.
 */
export function DeliveryLocationSummary({ location }: DeliveryLocationSummaryProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon icon={KIND_ICON[location.kind]} size="sm" className="shrink-0 text-muted-foreground" />

      <span className="flex min-w-0 flex-col gap-2">
        <span className="text-body-b6 text-foreground">{location.label}</span>
        <span className="truncate text-body-b10 text-muted-foreground">{location.address}</span>
      </span>
    </span>
  );
}
