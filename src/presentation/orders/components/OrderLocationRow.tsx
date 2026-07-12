"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Collapsible } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface OrderLocationRowProps {
  location: string;
  /** Saved-address label ("Home", "Gym") captured at checkout; falls back to the city when absent. */
  label?: string;
}

/**
 * The short label the collapsed row shows: the saved-address label when the order
 * carries one, otherwise the address's leading segment (its city) so legacy orders
 * still collapse to something meaningful.
 */
function collapsedLabel(location: string, label?: string): string {
  const fallback = location.split(",")[0].trim();
  return label?.trim() || fallback || location;
}

/**
 * Delivery location as a collapsible info row: shows just the saved-address label
 * ("Home", "Gym") by default and reveals the full address on demand. The label is
 * the trigger, so tapping it expands the address underneath. Radix owns the
 * open/close state and accessibility (`aria-expanded`/`aria-controls`).
 */
export function OrderLocationRow({ location, label }: OrderLocationRowProps) {
  const t = useTranslations("orders");
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="flex items-start justify-between gap-2 text-body-b6"
    >
      <dt className="text-muted-foreground">{t("locationLabel")}</dt>
      <dd className="flex min-w-0 flex-col items-end gap-1 text-right text-foreground">
        <Collapsible.Trigger className="inline-flex items-center gap-0.5 rounded text-label-l1 text-primary transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring">
          {collapsedLabel(location, label)}
          <Icon
            icon={ChevronDown}
            size="xs"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </Collapsible.Trigger>
        <Collapsible.Content className="text-muted-foreground">{location}</Collapsible.Content>
      </dd>
    </Collapsible.Root>
  );
}
