"use client";

import { useTranslations } from "next-intl";

import type { OrderPhase } from "@/src/domain/entities/Order";
import { FilterTab, FilterTabs } from "@/src/presentation/design-system";

const TABS: { value: OrderPhase; labelKey: "tabCurrent" | "tabPrevious" }[] = [
  { value: "current", labelKey: "tabCurrent" },
  { value: "previous", labelKey: "tabPrevious" },
];

interface OrderTabsProps {
  value: OrderPhase;
  onValueChange: (value: OrderPhase) => void;
}

/** Two-tab segmented control for switching between current and previous orders. */
export function OrderTabs({ value, onValueChange }: OrderTabsProps) {
  const t = useTranslations("orders");

  return (
    <FilterTabs
      value={value}
      onValueChange={(next) => onValueChange(next as OrderPhase)}
      aria-label={t("tabsAria")}
      layout="grid"
      variant="outlined"
      size="md"
    >
      {TABS.map((tab) => (
        <FilterTab key={tab.value} value={tab.value}>
          {t(tab.labelKey)}
        </FilterTab>
      ))}
    </FilterTabs>
  );
}
