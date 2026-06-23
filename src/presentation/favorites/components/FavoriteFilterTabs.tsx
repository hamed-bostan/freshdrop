"use client";

import { RadioGroup } from "radix-ui";
import { cn } from "@/src/lib/utils";
import type { Category } from "@/src/domain/entities/Category";

/** Sentinel value for the "All" tab (no category filter). */
export const ALL_FILTER = "all";

interface FavoriteFilterTabsProps {
  /** Categories to offer as filters (typically only those present in favorites). */
  categories: Category[];
  /** Selected category id, or `ALL_FILTER`. */
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Horizontally scrollable, single-select category filter. Built on Radix
 * RadioGroup (roving focus + arrow keys); the selected tab gets a green outline
 * pill, the rest are plain text. Bleeds to the screen edges so it scrolls
 * edge-to-edge while staying aligned to the page gutter.
 */
export function FavoriteFilterTabs({ categories, value, onValueChange }: FavoriteFilterTabsProps) {
  const tabs = [{ id: ALL_FILTER, name: "All" }, ...categories];

  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      loop
      aria-label="Filter favorites by category"
      className="-mx-6 flex gap-2 overflow-x-auto scrollbar-hide px-6"
    >
      {tabs.map((tab) => (
        <RadioGroup.Item
          key={tab.id}
          value={tab.id}
          className={cn(
            "flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4",
            "text-button-btn4 transition-colors",
            "border border-transparent text-foreground",
            "data-[state=checked]:border-primary data-[state=checked]:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {tab.name}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
