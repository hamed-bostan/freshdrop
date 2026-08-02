"use client";

import { cn } from "@/src/lib/utils";

type ChartSegmentedControlProps<T extends string> = {
  value: T;
  options: readonly T[];
  label: string;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  emphasis?: boolean;
};

/** Shared chart toggle used by report and overview charts. */
export function ChartSegmentedControl<T extends string>({ value, options, label, onChange, getLabel, emphasis = false }: ChartSegmentedControlProps<T>) {
  return (
    <div className="flex rounded-card-md border border-border p-0.5" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-card-md px-3 text-body-b10",
            emphasis ? "py-1.5 font-semibold" : "py-1 font-medium",
            value === option ? "bg-accent text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}
