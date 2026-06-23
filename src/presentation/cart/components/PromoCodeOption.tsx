import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { cn } from "@/src/lib/utils";

interface PromoCodeOptionProps {
  promo: PromoCode;
  /** Whether this is the currently-applied code. */
  selected: boolean;
  onSelect: (code: string) => void;
}

/**
 * A selectable promo in the list. Tapping it applies the code immediately
 * (there's no separate confirm). Selection is conveyed by the highlighted
 * border, matching the payment-method option style.
 */
export function PromoCodeOption({ promo, selected, onSelect }: PromoCodeOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(promo.code)}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col gap-1 rounded-card-xl border bg-surface px-4 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-foreground" : "border-transparent",
      )}
    >
      <span className="text-body-b4 text-foreground">{promo.title}</span>
      <span className="text-body-b10 text-muted-foreground">{promo.description}</span>
    </button>
  );
}
