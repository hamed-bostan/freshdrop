"use client";

import { ChevronLeft, ChevronDown, Search } from "lucide-react";
import { Button, Icon, Input } from "@/src/presentation/design-system";

interface LocationSearchBarProps {
  query: string;
  /** Current region/city label shown on the right (from reverse geocoding). */
  region: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
}

export function LocationSearchBar({ query, region, onQueryChange, onBack }: LocationSearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        iconOnly
        aria-label="Go back"
        onClick={onBack}
        className="shrink-0 rounded-full bg-background shadow-sm"
      >
        <Icon icon={ChevronLeft} size="lg" />
      </Button>

      <Input
        size="lg"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="street ..."
        aria-label="Search for a place"
        autoComplete="off"
        leftElement={<Icon icon={Search} size="sm" />}
        rightElement={
          <span className="flex max-w-28 items-center gap-1 text-button-btn4 text-foreground">
            <span className="truncate">{region}</span>
            <Icon icon={ChevronDown} size="sm" className="shrink-0" />
          </span>
        }
        inputClassName="rounded-full pr-28 shadow-sm"
      />
    </div>
  );
}
