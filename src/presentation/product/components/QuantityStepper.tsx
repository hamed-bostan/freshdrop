"use client";

import { Minus, Plus } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

/** Compact −/＋ quantity control. Clamped to `[min, max]`; presentation only. */
export function QuantityStepper({ value, onChange, min = 1, max = 99 }: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="grid size-8 place-items-center rounded-full text-foreground transition-colors disabled:text-disabled-foreground"
      >
        <Icon icon={Minus} size="sm" />
      </button>

      <span
        aria-live="polite"
        className="grid h-8 min-w-9 place-items-center rounded-card-md bg-background px-2 text-body-b4 text-foreground"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="grid size-8 place-items-center rounded-full text-primary transition-colors disabled:text-disabled-foreground"
      >
        <Icon icon={Plus} size="sm" />
      </button>
    </div>
  );
}
