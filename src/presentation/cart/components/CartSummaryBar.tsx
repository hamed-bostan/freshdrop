import { useTranslations } from "next-intl";
import { Button } from "@/src/presentation/design-system";

interface CartSummaryBarProps {
  total: number;
  onCheckout: () => void;
}

/**
 * Pinned cart total + checkout action. Floats just above the bottom nav
 * (`bottom-20`), constrained to the app's mobile column like the nav/sheets.
 */
export function CartSummaryBar({ total, onCheckout }: CartSummaryBarProps) {
  const t = useTranslations("cart");

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-md rounded-t-card-xl border-t border-border bg-surface px-6 pb-6 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-pill bg-border" aria-hidden />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-body-b2 text-foreground">{t("totalLabel")}</span>
        <span className="text-body-b4 text-foreground">${total.toFixed(2)}</span>
      </div>

      <Button type="button" size="lg" className="w-full" onClick={onCheckout}>
        {t("checkout")}
      </Button>
    </div>
  );
}
