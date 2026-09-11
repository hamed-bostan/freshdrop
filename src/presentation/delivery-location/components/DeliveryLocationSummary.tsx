import { Home, Building2, Dumbbell, MapPin, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import { Icon } from "@/src/presentation/design-system";

import { ADDRESS_PRESET_LABEL_KEY } from "../addressLabel";

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
  const t = useTranslations("addresses");
  // Preset kinds render their localized label; a custom ("other") address keeps its
  // user-authored label as stored.
  const presetKey = ADDRESS_PRESET_LABEL_KEY[location.kind];
  const label = presetKey ? t(presetKey) : location.label;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon icon={KIND_ICON[location.kind]} size="sm" className="shrink-0 text-muted-foreground" />

      <span className="flex min-w-0 flex-col gap-2">
        <span className="text-body-b6 text-foreground">{label}</span>
        <span className="truncate text-body-b10 text-muted-foreground">{location.address}</span>
      </span>
    </span>
  );
}
