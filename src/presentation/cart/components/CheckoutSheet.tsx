"use client";

import { useLocale, useTranslations } from "next-intl";
import { Dialog, VisuallyHidden } from "radix-ui";
import { ChevronRight, Ticket } from "lucide-react";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { formatMoney } from "@/src/lib/formatMoney";
import { isLocalizedPromo } from "../localizedPromos";

interface SummaryRowProps {
  label: string;
  value: string;
  /** The final total — rendered larger/bolder. */
  emphasized?: boolean;
}

function SummaryRow({ label, value, emphasized }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn(emphasized ? "text-body-b2 text-foreground" : "text-body-b7 text-muted-foreground")}>{label}</dt>
      <dd className={emphasized ? "text-body-b4 text-foreground" : "text-body-b7 text-muted-foreground"}>{value}</dd>
    </div>
  );
}

interface CheckoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedPromo: PromoCode | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  /** Final place-order action. */
  onConfirm: () => void;
}

/**
 * Checkout summary as an expandable bottom sheet over the cart. Built on Radix
 * Dialog directly (not the DS `Sheet`) so it can sit *above* the bottom nav
 * (`bottom-20`, overlay `z-40` under the nav's `z-50`) — the mockup keeps the
 * nav visible while the rest dims, which the full-height DS sheet can't do.
 */
export function CheckoutSheet({
  open,
  onOpenChange,
  appliedPromo,
  subtotal,
  shipping,
  discount,
  total,
  onConfirm,
}: CheckoutSheetProps) {
  const t = useTranslations("checkout");
  const tPromo = useTranslations("checkout.promos");
  const locale = useLocale();

  // Localize the applied promo's title by code, falling back to the stored copy.
  const promoTitle =
    appliedPromo == null
      ? null
      : isLocalizedPromo(appliedPromo.code)
        ? tPromo(`${appliedPromo.code}.title`)
        : appliedPromo.title;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-foreground/40",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />

        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-md",
            "rounded-t-card-xl bg-popover px-6 pb-8 pt-3 shadow-[var(--shadow-sheet)] focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            // Matches the DS Sheet: the slide goes under reduced motion, a fade replaces it.
            "motion-safe:data-[state=open]:slide-in-from-bottom",
            "motion-safe:data-[state=closed]:slide-out-to-bottom",
            "motion-reduce:data-[state=open]:fade-in-0",
            "motion-reduce:data-[state=closed]:fade-out-0",
            "duration-300",
          )}
        >
          <div className="mx-auto mb-5 h-1.5 w-18 rounded-pill bg-border" aria-hidden />

          <VisuallyHidden.Root asChild>
            <Dialog.Title>{t("title")}</Dialog.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Dialog.Description>{t("sheetDescription")}</Dialog.Description>
          </VisuallyHidden.Root>

          {/* Promo code — opens the promo screen to browse/enter a code. */}
          <Link
            href={appliedPromo ? `/cart/promo?applied=${appliedPromo.code}` : "/cart/promo"}
            className="flex h-12 items-center gap-3 rounded-input bg-input-filled px-4 transition-colors active:bg-muted-strong"
          >
            <Icon icon={Ticket} size="md" className="text-icon-muted" />
            {appliedPromo ? (
              <span className="flex-1 truncate text-body-b2 text-input-foreground">
                {promoTitle}
                <span className="text-muted-foreground"> · {t("percentOff", { percent: appliedPromo.discountPercent })}</span>
              </span>
            ) : (
              <span className="flex-1 text-body-b2 text-input-placeholder">{t("enterPromo")}</span>
            )}
            <Icon icon={ChevronRight} size="sm" className="text-icon-muted rtl:-scale-x-100" />
          </Link>

          <dl className="mt-6 flex flex-col gap-4">
            <SummaryRow label={t("subTotal")} value={formatMoney(subtotal, locale)} />
            <SummaryRow label={t("shipping")} value={formatMoney(shipping, locale)} />
            <SummaryRow label={t("discount")} value={`${discount > 0 ? "-" : ""}${formatMoney(discount, locale)}`} />
          </dl>

          <div className="my-5 border-t border-dashed border-border" aria-hidden />

          <dl>
            <SummaryRow label={t("totalLabel")} value={formatMoney(total, locale)} emphasized />
          </dl>

          {/* UI-only — no order creation / confirmation screen yet (TODO). */}
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t("checkOut")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
