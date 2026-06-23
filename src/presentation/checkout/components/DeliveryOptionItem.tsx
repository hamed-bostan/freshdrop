"use client";

import { cn } from "@/src/lib/utils";
import type { DeliveryOption } from "@/src/domain/entities/DeliveryOption";

interface DeliveryOptionItemProps {
  option: DeliveryOption;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A selectable delivery-time card, modelled as a native radio so the list is one
 * keyboard-navigable group. Mirrors `PaymentMethodOption`: the radio is hidden,
 * selection shown by the highlighted border, focus by the ring.
 */
export function DeliveryOptionItem({ option, selected, onSelect }: DeliveryOptionItemProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-card-xl border bg-surface px-4 py-2 transition-colors",
        "has-focus-visible:ring-2 has-focus-visible:ring-ring",
        selected ? "border-foreground" : "border-transparent",
      )}
    >
      <input
        type="radio"
        name="delivery-option"
        value={option.id}
        checked={selected}
        onChange={() => onSelect(option.id)}
        className="sr-only"
      />
      <span className="text-body-b6 text-foreground">{option.label}</span>
      <span className="text-body-b10 text-muted-foreground">{option.eta}</span>
    </label>
  );
}
