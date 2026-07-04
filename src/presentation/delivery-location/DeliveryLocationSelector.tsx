import { MapPin, ChevronDown } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { DeliveryLocationPickerSheet } from "./DeliveryLocationPickerSheet";

/** Trigger label when the user has no saved address yet. */
const NO_LOCATION_LABEL = "Select location";

/**
 * The default address drives the trigger: its city when the geocoder resolved one,
 * otherwise its (kind) label; fall back to the first address, then a prompt.
 */
function selectedRegion(locations: DeliveryLocation[]): string {
  const selected = locations.find((location) => location.isDefault) ?? locations[0];
  return selected?.city ?? selected?.label ?? NO_LOCATION_LABEL;
}

interface DeliveryLocationSelectorProps {
  locations: DeliveryLocation[];
}

/**
 * The home header's delivery-location control: shows the selected address's label and
 * opens the shared address picker sheet. The picker owns selection; this only supplies
 * the trigger. The label re-renders from the server default after each selection.
 */
export function DeliveryLocationSelector({ locations }: DeliveryLocationSelectorProps) {
  const region = selectedRegion(locations);

  return (
    <DeliveryLocationPickerSheet
      locations={locations}
      trigger={
        <button type="button" className="mx-auto flex items-center gap-1 text-foreground">
          <Icon icon={MapPin} size="sm" />
          <span className="max-w-[60vw] truncate text-button-btn4">{region}</span>
          <Icon icon={ChevronDown} size="sm" />
        </button>
      }
    />
  );
}
