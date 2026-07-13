"use client";

import { useLocale, useTranslations } from "next-intl";
import { RadioGroup } from "radix-ui";
import { getLangDir } from "@/src/i18n/direction";
import { cn } from "@/src/lib/utils";
import type { Category } from "@/src/domain/entities/Category";

/** Sentinel value for the "All" tab (no category filter). */
export const ALL_FILTER = "all";

/** Localized name keys under `category.names`, mirroring the catalog slugs. */
type CategoryNameKey =
  | "vegetables"
  | "dairy"
  | "meat-fish"
  | "grains-pulses"
  | "drinks"
  | "fruits"
  | "spices"
  | "sauce"
  | "spaghetti"
  | "bakery"
  | "sweets"
  | "jams"
  | "alcoholic-drink"
  | "teas"
  | "sausage"
  | "candys"
  | "soaps"
  | "oils";

/**
 * Category slug → its localized name key. Presentation owns this mapping so the
 * fixed catalog of categories renders in the active locale; a slug without a key
 * yet (e.g. a category added later) falls back to the stored catalog name.
 */
const NAME_KEYS: Record<string, CategoryNameKey> = {
  vegetables: "vegetables",
  dairy: "dairy",
  "meat-fish": "meat-fish",
  "grains-pulses": "grains-pulses",
  drinks: "drinks",
  fruits: "fruits",
  spices: "spices",
  sauce: "sauce",
  spaghetti: "spaghetti",
  bakery: "bakery",
  sweets: "sweets",
  jams: "jams",
  "alcoholic-drink": "alcoholic-drink",
  teas: "teas",
  sausage: "sausage",
  candys: "candys",
  soaps: "soaps",
  oils: "oils",
};

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
  const locale = useLocale();
  const t = useTranslations("favorites");
  const tName = useTranslations("category.names");
  // Localize each category by slug; the synthetic "All" tab is localized separately.
  const tabs = [
    { id: ALL_FILTER, name: t("filterAll") },
    ...categories.map((category) => {
      const key = NAME_KEYS[category.slug];
      return { id: category.id, name: key ? tName(key) : category.name };
    }),
  ];

  return (
    <RadioGroup.Root
      // Match the reading direction so arrow-key roving between tabs follows the
      // visual order under `fa` (Radix defaults to LTR without an explicit dir).
      dir={getLangDir(locale)}
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
