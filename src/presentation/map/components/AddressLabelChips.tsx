"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import { cn } from "@/src/lib/utils";
import { Chip, ChipGroup, focusRing, Icon } from "@/src/presentation/design-system";

/** The presets shown as chips; "other" is reached via the add button. */
const PRESETS: { kind: DeliveryLocationKind; labelKey: "presetHome" | "presetOffice" | "presetGym" }[] = [
  { kind: "home", labelKey: "presetHome" },
  { kind: "office", labelKey: "presetOffice" },
  { kind: "gym", labelKey: "presetGym" },
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
  const t = useTranslations("addresses");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChipGroup
        value={value}
        onValueChange={(next) => onChange(next as DeliveryLocationKind)}
        aria-label={t("saveAsAria")}
      >
        {PRESETS.map(({ kind, labelKey }) => (
          <Chip key={kind} value={kind}>
            {t(labelKey)}
          </Chip>
        ))}
      </ChipGroup>

      <button
        type="button"
        onClick={onAddCustom}
        aria-label={t("addCustomAria")}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground",
          focusRing,
        )}
      >
        <Icon icon={Plus} size="sm" />
      </button>
    </div>
  );
}
