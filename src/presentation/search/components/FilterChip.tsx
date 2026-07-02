"use client";

import { cn } from "@/src/lib/utils";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

/**
 * A toggle chip for the filter sheet, styled to match the design-system `Chip`.
 * Unlike the DS `Chip` (Radix single-select radio), this is a plain toggle so it
 * composes for both multi-select (dietary, brand) and clearable single-select
 * (category) groups.
 */
export function FilterChip({ label, selected, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex h-10 items-center justify-center rounded-full px-4 text-button-btn4 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
