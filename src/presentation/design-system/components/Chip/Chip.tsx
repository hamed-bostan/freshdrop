"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/src/lib/utils";

export type ChipGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

/**
 * Single-select chip group built on Radix RadioGroup: exactly one selected, with
 * roving tab-index + arrow-key navigation handled by Radix. Generic over a plain
 * string `value` — it carries no domain knowledge, so any feature can compose it
 * (e.g. `AddressLabelChips`). Provide an accessible name via `aria-label` /
 * `aria-labelledby`.
 */
export const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
));

ChipGroup.displayName = "ChipGroup";

export type ChipProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

/**
 * A selectable chip; must live inside a <ChipGroup>. Filled (`primary`) when
 * selected, outlined when not — driven by Radix's `data-state`, so there is no
 * controlled `selected` prop to keep in sync.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-button-btn4 transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "data-[state=unchecked]:border data-[state=unchecked]:border-border data-[state=unchecked]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));

Chip.displayName = "Chip";
