"use client";

import { CreditCard } from "lucide-react";
import { Icon, SelectableTile } from "@/src/presentation/design-system";
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
    <SelectableTile
      name="payment-method"
      value={card.id}
      selected={selected}
      onSelect={() => onSelect(card.id)}
      size="sm"
    >
      <Icon icon={CreditCard} className="text-foreground" />
      <span className="text-body-b6 text-foreground">
        {card.brand} •••• {lastFour}
      </span>
    </SelectableTile>
  );
}
