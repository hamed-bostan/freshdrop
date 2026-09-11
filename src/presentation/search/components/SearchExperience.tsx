"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import type { Category } from "@/src/domain/entities/Category";
import type { ProductFilters, ProductSort } from "@/src/domain/entities/ProductFilters";
import { DEFAULT_PRODUCT_SORT, hasProductSearchCriteria } from "@/src/domain/entities/ProductFilters";
import { useRouter } from "@/src/i18n/navigation";
import { buildProductFilterParams } from "@/src/lib/api/product-search-params";
import { cn } from "@/src/lib/utils";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { focusRing, Select } from "@/src/presentation/design-system";

import { ProductFilterSheet } from "./ProductFilterSheet";

/** Sort options in display order, keyed to their `search` namespace labels. */
const SORT_OPTIONS: { value: ProductSort; labelKey: "sortName" | "sortPriceAsc" | "sortPriceDesc" | "sortRating" }[] = [
  { value: "name", labelKey: "sortName" },
  { value: "price-asc", labelKey: "sortPriceAsc" },
  { value: "price-desc", labelKey: "sortPriceDesc" },
  { value: "rating", labelKey: "sortRating" },
];

interface SearchExperienceProps {
  /** The active search term, prefilled into the field. */
  query: string;
  /** The committed filters parsed from the URL. */
  filters: ProductFilters;
  categories: Category[];
  /** Server-rendered results (grid or empty state) — dimmed while a refinement is in flight. */
  children: React.ReactNode;
}

/**
 * Client shell for the results page. Refinements (sort, filter apply, clear) are
 * URL-driven so the server stays the single source of truth and results remain
 * shareable/bookmarkable — but they run inside a transition so the page never
 * blocks: the controls update optimistically and the current results stay visible
 * (dimmed) until the server re-render commits. `router.replace` keeps rapid
 * refinements out of history; a brand-new query (the `SearchBar`) still pushes.
 */
export function SearchExperience({ query, filters, categories, children }: SearchExperienceProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  // Reflects the drafted filters instantly during the pending navigation, then
  // reverts to the server-confirmed `filters` once it commits.
  const [optimisticFilters, setOptimisticFilters] = React.useOptimistic(filters);

  const activeCount = countActiveFilters(optimisticFilters);
  const showControls = hasProductSearchCriteria(optimisticFilters);

  function refine(next: ProductFilters): void {
    const queryString = buildProductFilterParams(next).toString();
    startTransition(() => {
      setOptimisticFilters(next);
      router.replace(queryString ? `/search?${queryString}` : "/search");
    });
  }

  function applyFilters(next: ProductFilters): void {
    setOpen(false);
    // Keep the active term + sort; the sheet owns everything else.
    refine({ ...next, query: filters.query, sort: filters.sort });
  }

  function clearFilters(): void {
    refine({ query: filters.query, sort: filters.sort });
  }

  function changeSort(sort: ProductSort): void {
    refine({ ...filters, sort });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SearchBar defaultValue={query} onFilterClick={() => setOpen(true)} />

        <ProductFilterSheet
          open={open}
          onOpenChange={setOpen}
          categories={categories}
          initial={optimisticFilters}
          onApply={applyFilters}
        />

        {showControls && (
          <div className="flex items-center justify-between gap-3">
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className={cn("rounded-sm text-body-b8 text-primary", focusRing)}
              >
                {t("clearFilters", { count: activeCount })}
              </button>
            ) : (
              <span />
            )}

            <label className="flex items-center gap-2 text-body-b8 text-muted-foreground">
              {t("sortLabel")}
              <Select
                size="sm"
                className="w-auto"
                aria-label={t("sortAria")}
                value={optimisticFilters.sort ?? DEFAULT_PRODUCT_SORT}
                onChange={(event) => changeSort(event.target.value as ProductSort)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}
      </div>

      {/* Results stay put and readable during a refinement — dimmed + inert, with
          aria-busy so assistive tech announces the update in progress. */}
      <div
        aria-busy={isPending}
        className={cn("transition-opacity duration-200", isPending && "pointer-events-none opacity-60")}
      >
        {children}
      </div>
    </div>
  );
}

/** Count applied filters (price range counts as one), excluding the search term. */
function countActiveFilters(filters: ProductFilters): number {
  let count = 0;
  if (filters.categoryId) count += 1;
  if (filters.minPrice != null || filters.maxPrice != null) count += 1;
  count += filters.dietary?.length ?? 0;
  count += filters.brands?.length ?? 0;
  return count;
}
