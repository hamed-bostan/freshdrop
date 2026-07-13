"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("favorites");
  // Category names arrive already localized from the catalog (BFF), so render them
  // as-is; the synthetic "All" tab is the only UI-owned label here.
  const tabs = [
    { id: ALL_FILTER, name: t("filterAll") },
    ...categories.map((category) => ({ id: category.id, name: category.name })),
  ];

  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      loop
      aria-label={t("filterAria")}
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
