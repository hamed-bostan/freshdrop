"use client";

import { Plus } from "lucide-react";
import { Chip, ChipGroup, Icon } from "@/src/presentation/design-system";
import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";

/** The presets shown as chips; "other" is reached via the add button. */
const PRESETS: { kind: DeliveryLocationKind; label: string }[] = [
  { kind: "home", label: "Home" },
  { kind: "office", label: "Office" },
  { kind: "gym", label: "Gym" },
];

interface AddressLabelChipsProps {
  value: DeliveryLocationKind;
  onChange: (kind: DeliveryLocationKind) => void;
  onAddCustom?: () => void;
}

/**
 * "Save address as" selector: a thin feature wrapper binding the domain's
 * `DeliveryLocationKind` to the generic design-system <ChipGroup>. The trailing
 * "+" is an action (add a custom label), not a selectable chip.
 */
export function AddressLabelChips({ value, onChange, onAddCustom }: AddressLabelChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChipGroup
        value={value}
        onValueChange={(next) => onChange(next as DeliveryLocationKind)}
        aria-label="Save address as"
      >
        {PRESETS.map(({ kind, label }) => (
          <Chip key={kind} value={kind}>
            {label}
          </Chip>
        ))}
      </ChipGroup>

      <button
        type="button"
        onClick={onAddCustom}
        aria-label="Add a custom label"
        className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon={Plus} size="sm" />
      </button>
    </div>
  );
}
