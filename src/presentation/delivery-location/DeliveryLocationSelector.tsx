"use client";

import * as React from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Icon, Sheet, SheetTrigger, SheetContent, Button } from "@/src/presentation/design-system";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { DeliveryLocationItem } from "./components/DeliveryLocationItem";

interface DeliveryLocationSelectorProps {
  /** Short region label shown on the trigger (e.g. the current city). */
  region: string;
  locations: DeliveryLocation[];
  defaultSelectedId?: string;
  onAddNewLocation?: () => void;
}

export function DeliveryLocationSelector({
  region,
  locations,
  defaultSelectedId,
  onAddNewLocation,
}: DeliveryLocationSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(defaultSelectedId ?? locations[0]?.id);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="mx-auto flex items-center gap-1 text-foreground">
        <Icon icon={MapPin} size="sm" />
        <span className="text-button-btn4">{region}</span>
        <Icon icon={ChevronDown} size="sm" />
      </SheetTrigger>

      <SheetContent
        title="Select Your Delivery Location"
        description="Choose which saved address your order should be delivered to."
      >
        <ul className="flex flex-col gap-2">
          {locations.map((location) => (
            <li key={location.id}>
              <DeliveryLocationItem
                location={location}
                selected={location.id === selectedId}
                onSelect={() => handleSelect(location.id)}
              />
            </li>
          ))}
        </ul>

        <Button variant="link" type="button" onClick={onAddNewLocation} className="mt-8 text-button-btn4 mx-auto">
          add new location
        </Button>
      </SheetContent>
    </Sheet>
  );
}
