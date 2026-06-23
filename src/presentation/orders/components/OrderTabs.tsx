"use client";

import { RadioGroup } from "radix-ui";
import type { OrderPhase } from "@/src/domain/entities/Order";
import { cn } from "@/src/lib/utils";

const TABS: { value: OrderPhase; label: string }[] = [
  { value: "current", label: "Current orders" },
  { value: "previous", label: "Previous orders" },
];

interface OrderTabsProps {
  value: OrderPhase;
  onValueChange: (value: OrderPhase) => void;
}

/**
 * Two-tab segmented control for switching between current and previous orders.
 * Built on Radix RadioGroup (roving focus + arrow keys, exactly one selected);
 * the selected tab gets a tinted green outline pill, the other a neutral border.
 */
export function OrderTabs({ value, onValueChange }: OrderTabsProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(next) => onValueChange(next as OrderPhase)}
      orientation="horizontal"
      loop
      aria-label="Filter orders"
      className="grid grid-cols-2 gap-3"
    >
      {TABS.map((tab) => (
        <RadioGroup.Item
          key={tab.value}
          value={tab.value}
          className={cn(
            "flex h-11 items-center justify-center whitespace-nowrap rounded-full border px-4",
            "text-button-btn4 transition-colors",
            "border-border text-foreground",
            "data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {tab.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
