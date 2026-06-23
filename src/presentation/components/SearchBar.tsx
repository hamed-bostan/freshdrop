"use client";

import * as React from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { Button, Icon, Input } from "@/src/presentation/design-system";

interface SearchBarProps {
  /**
   * Placeholder shown while the field is empty. A ReactNode (not the native
   * `placeholder` attribute) so callers can emphasise part of it — e.g. the
   * coloured brand name — which a plain attribute cannot express. Defaults to the
   * Fresh Drop brand hint shared across the storefront.
   */
  placeholder?: React.ReactNode;
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
 * The placeholder is overlaid (rather than set via the native attribute) so the
 * brand name can be coloured; it shows only while the field is empty.
 */
export function SearchBar({
  placeholder = DEFAULT_PLACEHOLDER,
  onFilterClick,
  hideFilter = false,
}: SearchBarProps) {
  const [value, setValue] = React.useState("");

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-full">
        <Input
          type="search"
          variant="filled"
          size="lg"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Search products"
          leftElement={<Icon icon={Search} size="md" />}
        />
        {value === "" && (
          <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-body-b2 text-input-placeholder">
            {placeholder}
          </span>
        )}
      </div>

      {!hideFilter && (
        <Button size="lg" iconOnly variant="outline" aria-label="Open filters" onClick={onFilterClick}>
          <Icon icon={SlidersHorizontal} />
        </Button>
      )}
    </div>
  );
}
