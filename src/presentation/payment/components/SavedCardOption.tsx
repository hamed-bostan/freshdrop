"use client";

import { CreditCard } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { SavedCard } from "@/src/domain/entities/Wallet";

interface SavedCardOptionProps {
  card: SavedCard;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A saved card rendered as a selectable payment option — the same radio treatment
 * as `PaymentMethodOption`, so cards and the fixed options form one keyboard-
 * navigable group. The label shows the brand and the masked last-four only.
 */
export function SavedCardOption({ card, selected, onSelect }: SavedCardOptionProps) {
  const lastFour = card.number.replace(/\D/g, "").slice(-4);

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
        value={card.id}
        checked={selected}
        onChange={() => onSelect(card.id)}
        className="sr-only"
      />
      <Icon icon={CreditCard} className="text-foreground" />
      <span className="text-body-b6 text-foreground">
        {card.brand} •••• {lastFour}
      </span>
    </label>
  );
}
