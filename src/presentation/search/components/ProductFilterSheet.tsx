"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { Category } from "@/src/domain/entities/Category";
import type { ProductFilters } from "@/src/domain/entities/ProductFilters";
import { DIETARY_TAGS, PRODUCT_BRANDS } from "@/src/domain/entities/ProductFilters";
import { Button, Input, Sheet, SheetContent } from "@/src/presentation/design-system";
import { FilterChip } from "./FilterChip";

interface ProductFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** The committed filters the draft is seeded from each time the sheet opens. */
  initial: ProductFilters;
  /** Called with the drafted filters (query is preserved by the caller). */
  onApply: (filters: ProductFilters) => void;
}

/**
 * Bottom-sheet filter editor. Holds its selections as local draft state until the
 * user hits Apply — the parent then serialises them into the `/search` URL and the
 * server re-renders. Nothing is committed on toggle, so closing the sheet discards
 * unapplied changes.
 */
export function ProductFilterSheet({
  open,
  onOpenChange,
  categories,
  initial,
  onApply,
}: ProductFilterSheetProps) {
  const t = useTranslations("search");
  const [categoryId, setCategoryId] = React.useState<string | undefined>(initial.categoryId);
  const [minPrice, setMinPrice] = React.useState(initial.minPrice != null ? String(initial.minPrice) : "");
  const [maxPrice, setMaxPrice] = React.useState(initial.maxPrice != null ? String(initial.maxPrice) : "");
  const [dietary, setDietary] = React.useState<string[]>(initial.dietary ?? []);
  const [brands, setBrands] = React.useState<string[]>(initial.brands ?? []);

  // Reseed the draft from the committed filters whenever the sheet (re)opens.
  React.useEffect(() => {
    if (!open) return;
    setCategoryId(initial.categoryId);
    setMinPrice(initial.minPrice != null ? String(initial.minPrice) : "");
    setMaxPrice(initial.maxPrice != null ? String(initial.maxPrice) : "");
    setDietary(initial.dietary ?? []);
    setBrands(initial.brands ?? []);
  }, [open, initial]);

  function toggleIn(setter: React.Dispatch<React.SetStateAction<string[]>>, value: string): void {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function handleClear(): void {
    setCategoryId(undefined);
    setMinPrice("");
    setMaxPrice("");
    setDietary([]);
    setBrands([]);
  }

  function handleApply(): void {
    onApply({
      categoryId,
      minPrice: toPrice(minPrice),
      maxPrice: toPrice(maxPrice),
      dietary: dietary.length ? dietary : undefined,
      brands: brands.length ? brands : undefined,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t("filtersTitle")}
        description={t("filtersDescription")}
      >
        <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pb-2">
          <fieldset>
            <legend className="mb-3 text-body-b4 text-foreground">{t("priceLegend")}</legend>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t("minPlaceholder")}
                aria-label={t("minPriceAria")}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <span className="text-body-b6 text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t("maxPlaceholder")}
                aria-label={t("maxPriceAria")}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-body-b4 text-foreground">{t("categoryLegend")}</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onToggle={() =>
                    setCategoryId((current) => (current === category.id ? undefined : category.id))
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-body-b4 text-foreground">{t("dietaryLegend")}</legend>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={tag}
                  selected={dietary.includes(tag)}
                  onToggle={() => toggleIn(setDietary, tag)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-body-b4 text-foreground">{t("brandLegend")}</legend>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_BRANDS.map((brand) => (
                <FilterChip
                  key={brand}
                  label={brand}
                  selected={brands.includes(brand)}
                  onToggle={() => toggleIn(setBrands, brand)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClear}>
            {t("clearAll")}
          </Button>
          <Button type="button" className="flex-1" onClick={handleApply}>
            {t("apply")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** A non-negative finite price from the raw input, or `undefined` when blank/invalid. */
function toPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
