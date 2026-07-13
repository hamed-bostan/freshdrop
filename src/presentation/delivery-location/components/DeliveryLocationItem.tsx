"use client";

import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { ADDRESS_PRESET_LABEL_KEY } from "../addressLabel";
import { DeliveryLocationSummary } from "./DeliveryLocationSummary";

interface DeliveryLocationItemProps {
  location: DeliveryLocation;
  selected: boolean;
  /** Picking the address is in-page state (which one to deliver to), so it's a callback. */
  onSelect: () => void;
  /** Editing is a navigation, so it's a real link target rather than a callback. */
  editHref: string;
}

export function DeliveryLocationItem({ location, selected, onSelect, editHref }: DeliveryLocationItemProps) {
  const t = useTranslations("addresses");
  const presetKey = ADDRESS_PRESET_LABEL_KEY[location.kind];
  const label = presetKey ? t(presetKey) : location.label;

  return (
    <div
      className={cn(
        "flex items-center gap-5 rounded-card-xl border px-4 py-2 bg-surface justify-between",
        selected ? "border-foreground" : "border-transparent",
      )}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="flex min-w-0 items-center text-start">
        <DeliveryLocationSummary location={location} />
      </button>

      <Button asChild variant="ghost" iconOnly aria-label={t("editAria", { label })}>
        <Link href={editHref}>
          <Icon icon={Pencil} size="sm" />
        </Link>
      </Button>
    </div>
  );
}
