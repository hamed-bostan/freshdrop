"use client";

import { cn } from "@/src/lib/utils";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { PaymentMethodIcon } from "./PaymentMethodIcon";

interface PaymentMethodOptionProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A single selectable payment method, modelled as a native radio so the whole
 * list behaves as one keyboard-navigable group (arrow keys, form semantics).
 * The radio is visually hidden; selection is conveyed by the highlighted
 * border, and keyboard focus by the ring (driven via `has-[:focus-visible]`).
 */
export function PaymentMethodOption({ method, selected, onSelect }: PaymentMethodOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-card-xl border bg-muted px-4 py-2 transition-colors",
        "has-focus-visible:ring-2 has-focus-visible:ring-ring",
        selected ? "border-foreground" : "border-transparent",
      )}
    >
      <input
        type="radio"
        name="payment-method"
        value={method.id}
        checked={selected}
        onChange={() => onSelect(method.id)}
        className="sr-only"
      />
      <PaymentMethodIcon methodId={method.id} />
      <span className="text-body-b6 text-foreground">{method.label}</span>
    </label>
  );
}
