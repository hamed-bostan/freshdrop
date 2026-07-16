import { useLocale, useTranslations } from "next-intl";
import type { Order } from "@/src/domain/entities/Order";
import { orderShippingRefunded } from "@/src/domain/entities/Order";
import { formatMoney, formatMoneySum } from "@/src/lib/formatMoney";

interface OrderAdjustmentsProps {
  order: Order;
}

/**
 * The money side of out-of-stock resolutions: a per-line list of what was credited
 * back to the customer's wallet, then the net amount they actually paid. The order
 * `total` stays the original charge (the immutable record) — this only makes the
 * wallet credits visible, the itemized-refund receipt shoppers expect from
 * Instacart/Walmart/Snapp Market. Renders nothing when no money was refunded.
 */
export function OrderAdjustments({ order }: OrderAdjustmentsProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const money = (amount: number) => formatMoney(amount, locale);
  const refunds = order.items.flatMap((item) =>
    item.substitution && item.substitution.refundAmount > 0
      ? [{ item, substitution: item.substitution }]
      : [],
  );
  // The delivery fee is refunded only when the whole order was out of stock and
  // cancelled — an empty delivery. Shown as its own line so the itemization adds
  // up to net paid (industry-standard: a fully cancelled order reads as $0).
  const shippingRefund = orderShippingRefunded(order);
  if (refunds.length === 0 && shippingRefund === 0) return null;

  return (
    <dl className="flex w-full flex-col gap-2 rounded-card-md bg-surface-sunken px-3 py-2 text-body-b6">
      <p className="text-body-b8 text-muted-foreground">{t("refundedToWallet")}</p>

      {refunds.map(({ item, substitution }) => (
        <div key={item.productId} className="flex items-start justify-between gap-2">
          <dt className="truncate text-muted-foreground">
            {substitution.status === "substituted"
              ? t("adjustmentSubstituted", { name: item.name })
              : t("adjustmentOutOfStock", { name: item.name })}
          </dt>
          <dd className="shrink-0 text-foreground">− {money(substitution.refundAmount)}</dd>
        </div>
      ))}

      {shippingRefund > 0 && (
        <div className="flex items-start justify-between gap-2">
          <dt className="truncate text-muted-foreground">{t("adjustmentDeliveryCancelled")}</dt>
          <dd className="shrink-0 text-foreground">− {money(shippingRefund)}</dd>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <dt className="text-foreground">{t("netPaid")}</dt>
        {/* Net paid derived from the displayed (rounded) lines — the order card's total
            minus each refund shown above — so the receipt's arithmetic always adds up
            under fa's whole-Toman rounding (mirrors `orderNetPaid`). */}
        <dd className="text-body-b7 text-foreground">
          {formatMoneySum(
            [
              order.total,
              ...refunds.map(({ substitution }) => -substitution.refundAmount),
              -shippingRefund,
            ],
            locale,
          )}
        </dd>
      </div>
    </dl>
  );
}
