import type { SavedCard } from "@/src/domain/entities/Wallet";
import { cn } from "@/src/lib/utils";

interface WalletCardProps {
  card: SavedCard;
  /** Gradient (and any other) classes for the card surface. */
  className?: string;
}

/** A saved payment card rendered as a gradient card face. */
export function WalletCard({ card, className }: WalletCardProps) {
  return (
    <article
      className={cn("flex h-36 w-61.75 shrink-0 flex-col rounded-card-xl px-6 py-4 text-primary-foreground", className)}
    >
      <p className="text-heading-h3">{card.brand}</p>
      <p className="mt-auto text-body-b6 text-primary-foreground/90">{card.holderName}</p>

      <p className="mt-1 ms-4 text-body-b3 tracking-wide">{card.number}</p>
      <p className="mt-1 text-body-b6 text-primary-foreground/90">{card.expiry}</p>
    </article>
  );
}
