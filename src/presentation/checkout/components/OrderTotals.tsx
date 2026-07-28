import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatMoneySum } from "@/src/lib/formatMoney";

interface OrderTotalsProps {
  subtotal: number;
  shipping: number;
  discount: number;
  /** VAT portion already included in the total, or `null` when tax isn't in effect. */
  taxAmount?: number | null;
  /** Amount paid from the wallet balance, deducted from what's shown as due. */
  walletApplied?: number;
}

/**
 * The price breakdown: subtotal, delivery fee and discount (each underlined),
 * then the emphasized total payment — always displayed as the sum of the rows
 * above it (`total = subtotal + shipping - discount` is the stored invariant).
 * When `taxAmount` is present, a note below the total clarifies it's already
 * included — tax-inclusive pricing means it never changes what's charged. When
 * `walletApplied` is set, an extra row deducts it and the emphasized total
 * becomes what's actually charged to the selected payment method.
 */
export function OrderTotals({ subtotal, shipping, discount, taxAmount, walletApplied = 0 }: OrderTotalsProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const money = (amount: number) => formatMoney(amount, locale);
  const rows = [
    { label: t("subtotal"), value: money(subtotal) },
    { label: t("deliveryFee"), value: money(shipping) },
    { label: t("discount"), value: money(discount) },
    ...(walletApplied > 0 ? [{ label: t("walletDeduction"), value: `-${money(walletApplied)}` }] : []),
  ];
  // Derived from the displayed (rounded) rows rather than `total`, so the visible
  // arithmetic always adds up under fa's whole-Toman rounding.
  const totalValue = formatMoneySum([subtotal, shipping, -discount, -walletApplied], locale);

  return (
    <div className="flex w-full flex-col gap-2 px-4 py-2">
      <dl className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4 text-body-b6">
              <dt className="text-foreground">{row.label}</dt>
              <dd className="text-muted-foreground">{row.value}</dd>
            </div>
            <div className="h-px w-full bg-border" aria-hidden />
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-4">
        <span className="text-body-b7 text-foreground">{t("totalPayment")}</span>
        <span className="text-body-b6 text-foreground">{totalValue}</span>
      </div>

      {taxAmount != null && (
        <p className="text-end text-body-b9 text-muted-foreground">
          {t("includesVat", { amount: money(taxAmount) })}
        </p>
      )}
    </div>
  );
}
