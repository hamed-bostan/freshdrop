"use client";

import { SlidersHorizontal, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import type { Product } from "@/src/domain/entities/Product";
import { useRouter } from "@/src/i18n/navigation";
import { Button, Icon, Input } from "@/src/presentation/design-system";
import { useProductSearch } from "@/src/presentation/product/hooks/use-product-search";

import { SearchSuggestions } from "./SearchSuggestions";

/** How many typeahead rows to float under the field; the results page shows the rest. */
const MAX_SUGGESTIONS = 6;

interface SearchBarProps {
  /**
   * Placeholder shown while the field is empty. A ReactNode (not the native
   * `placeholder` attribute) so callers can emphasise part of it — e.g. the
   * coloured brand name — which a plain attribute cannot express. Defaults to the
   * Fresh Drop brand hint shared across the storefront.
   */
  placeholder?: React.ReactNode;
  /** Initial query — set on the results page so the field reflects the active search. */
  defaultValue?: string;
  /** Invoked when the trailing filter button is pressed. */
  onFilterClick?: () => void;
  /** Hide the trailing filter button to render the search field on its own. */
  hideFilter?: boolean;
}

/**
 * Storefront search field: the design-system `Input` in its `filled` variant —
 * the borderless grey well that distinguishes search from the white, bordered
 * form fields — plus an optional filter button.
 *
 * Submitting (Enter) navigates to the `/search` results page; typing floats a
 * debounced product typeahead (`useProductSearch`) whose rows jump straight to a
 * product. The panel closes on submit, selection, Escape, or focus leaving the
 * field. The placeholder is overlaid (rather than set via the native attribute)
 * so the brand name can be coloured; it shows only while the field is empty.
 */
export function SearchBar({
  placeholder,
  defaultValue = "",
  onFilterClick,
  hideFilter = false,
}: SearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);

  // Defaults to the brand hint; the coloured brand name comes from the rich `brand` tag.
  const resolvedPlaceholder =
    placeholder ??
    t.rich("brandHint", { brand: (chunks) => <span className="text-primary">{chunks}</span> });
  const [isOpen, setIsOpen] = React.useState(false);
  const { results } = useProductSearch(value);

  const suggestions = results.slice(0, MAX_SUGGESTIONS);
  const showSuggestions = isOpen && value.trim() !== "" && suggestions.length > 0;

  function submitSearch(): void {
    const trimmed = value.trim();
    if (trimmed === "") return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSelect(product: Product): void {
    setIsOpen(false);
    router.push(`/product/${product.id}`);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      // Close the panel once focus leaves the field entirely (React `onBlur`
      // bubbles); selecting a suggestion keeps focus inside, so it stays open.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
      className="flex items-center gap-4"
    >
      <div className="relative w-full">
        <Input
          type="search"
          variant="filled"
          size="lg"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          aria-label={t("inputAria")}
          autoComplete="off"
          leftElement={<Icon icon={Search} size="md" />}
        />
        {value === "" && (
          <span className="pointer-events-none absolute start-10 top-1/2 -translate-y-1/2 text-body-b2 text-input-placeholder">
            {resolvedPlaceholder}
          </span>
        )}
        {showSuggestions && <SearchSuggestions results={suggestions} onSelect={handleSelect} />}
      </div>

      {!hideFilter && (
        <Button
          type="button"
          size="lg"
          iconOnly
          variant="outline"
          aria-label={t("openFilters")}
          onClick={onFilterClick}
        >
          <Icon icon={SlidersHorizontal} />
        </Button>
      )}
    </form>
  );
}
