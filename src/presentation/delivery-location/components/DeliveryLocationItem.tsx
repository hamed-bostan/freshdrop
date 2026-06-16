"use client";

import { Pencil } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { DeliveryLocationSummary } from "./DeliveryLocationSummary";

interface DeliveryLocationItemProps {
  location: DeliveryLocation;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
}

export function DeliveryLocationItem({ location, selected, onSelect, onEdit }: DeliveryLocationItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-5 rounded-card-xl border px-4 py-2 bg-card justify-between",
        selected ? "border-foreground" : "border-transparent",
      )}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="flex min-w-0 items-center text-left">
        <DeliveryLocationSummary location={location} />
      </button>

      <Button variant="ghost" iconOnly type="button" onClick={onEdit} aria-label={`Edit ${location.label} address`}>
        <Icon icon={Pencil} size="sm" />
      </Button>
    </div>
  );
}
