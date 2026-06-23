import Image, { type StaticImageData } from "next/image";
import { Coins, Wallet, CreditCard, type LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { paypalIcon, applePayIcon, googlePayIcon } from "@/src/shared/assets/images";

/**
 * Keeps icon details out of the domain: a `PaymentMethod` only knows its `id`,
 * and the UI decides whether to render a themeable Lucide glyph (cash, wallet,
 * card) or a full-colour brand logo (PayPal, Apple Pay, Google Pay).
 */
type IconEntry = { kind: "lucide"; icon: LucideIcon; className?: string } | { kind: "brand"; src: StaticImageData };

const ICONS: Record<string, IconEntry> = {
  // Gold coin — reuses the app's amber `rating` token (the shared gold accent).
  "cash-on-delivery": { kind: "lucide", icon: Coins, className: "text-rating" },
  wallet: { kind: "lucide", icon: Wallet, className: "text-muted-foreground" },
  "add-card": { kind: "lucide", icon: CreditCard, className: "text-foreground" },
  paypal: { kind: "brand", src: paypalIcon },
  "apple-pay": { kind: "brand", src: applePayIcon },
  "google-pay": { kind: "brand", src: googlePayIcon },
};

interface PaymentMethodIconProps {
  methodId: string;
  className?: string;
}

export function PaymentMethodIcon({ methodId, className }: PaymentMethodIconProps) {
  const entry = ICONS[methodId];

  if (!entry) return null;

  if (entry.kind === "lucide") {
    return <Icon icon={entry.icon} className={cn(entry.className, className)} />;
  }

  // Decorative: the adjacent text label already names the method.
  return <Image src={entry.src} alt="" width={20} height={20} className={cn("size-6 object-contain", className)} />;
}
