"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search } from "lucide-react";
import type { Product } from "@/src/domain/entities/Product";
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

const DEFAULT_PLACEHOLDER = (
  <>
    Search on <span className="text-primary">FRESH DROP</span>
  </>
);

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
  placeholder = DEFAULT_PLACEHOLDER,
  defaultValue = "",
  onFilterClick,
  hideFilter = false,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);
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
          aria-label="Search products"
          autoComplete="off"
          leftElement={<Icon icon={Search} size="md" />}
        />
        {value === "" && (
          <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-body-b2 text-input-placeholder">
            {placeholder}
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
          aria-label="Open filters"
          onClick={onFilterClick}
        >
          <Icon icon={SlidersHorizontal} />
        </Button>
      )}
    </form>
  );
}
