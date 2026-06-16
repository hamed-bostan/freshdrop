"use client";

import * as React from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { Button, Icon, Input } from "@/src/presentation/design-system";

interface SearchBarProps {
  /**
   * Placeholder shown while the field is empty. Accepts rich content so callers
   * can emphasise part of it (e.g. a coloured brand name) — something a native
   * `placeholder` attribute cannot express.
   */
  placeholder?: React.ReactNode;
}

export function SearchBar({ placeholder = "Search on" }: SearchBarProps) {
  const [value, setValue] = React.useState("");

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-full">
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Search products"
          leftElement={<Icon icon={Search} size="md" />}
          size="lg"
        />
        {value === "" && (
          <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-body-b2 text-input-placeholder">
            {placeholder}
          </span>
        )}
      </div>

      <Button size="lg" iconOnly variant="outline" aria-label="Open filters">
        <Icon icon={SlidersHorizontal} />
      </Button>
    </div>
  );
}
