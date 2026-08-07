"use client";

import { useTranslations } from "next-intl";

import type { Category } from "@/src/domain/entities/Category";
import { FilterTab, FilterTabs } from "@/src/presentation/design-system";

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
 * Horizontally scrollable, single-select category filter. Bleeds to the screen
 * edges so it scrolls edge-to-edge while its first tab stays aligned to the page
 * gutter.
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
    <FilterTabs
      value={value}
      onValueChange={onValueChange}
      aria-label={t("filterAria")}
      className="-mx-6 px-6"
    >
      {tabs.map((tab) => (
        <FilterTab key={tab.id} value={tab.id}>
          {tab.name}
        </FilterTab>
      ))}
    </FilterTabs>
  );
}
