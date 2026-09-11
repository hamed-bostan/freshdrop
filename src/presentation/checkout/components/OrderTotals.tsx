import { Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatMoney, formatMoneySum } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";

interface Props { subtotal: number; shipping: number; discount: number; taxAmount?: number | null; walletApplied?: number; paymentLabel?: string; }

export function OrderTotals({ subtotal, shipping, discount, taxAmount, walletApplied = 0, paymentLabel = "" }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const money = (value: number) => formatMoney(value, locale);
  const total = formatMoneySum([subtotal, shipping, -discount], locale);
  const charged = formatMoneySum([subtotal, shipping, -discount, -walletApplied], locale);
  const rows = [
    [t("subtotal"), money(subtotal), ""], [t("deliveryFee"), money(shipping), ""],
    [t("discount"), `−${money(discount)}`, "text-primary"], [t("vat"), money(taxAmount ?? 0), ""],
  ];
  return <section className="rounded-[18px] border border-border p-4 sm:rounded-[22px] sm:p-5">
    <h2 className="mb-3 text-lg font-semibold">{t("priceDetails")}</h2>
    <dl className="space-y-2">{rows.map(([label, value, className]) => <div key={label} className="flex justify-between gap-4 text-sm sm:text-base"><dt className="text-muted-foreground">{label}</dt><dd className={className}>{value}</dd></div>)}</dl>
    <div className="my-3 h-px bg-border" />
    <div className="flex justify-between text-xl font-semibold"><span>{t("total")}</span><span className="text-primary">{total}</span></div>
    {walletApplied > 0 && <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm sm:text-base">
      <div className="flex items-center justify-between"><span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon icon={Wallet} size="sm" /></span>{t("walletName")}</span><span className="text-primary">−{money(walletApplied)}</span></div>
      <div className="flex items-center justify-between gap-4"><span className="min-w-0 truncate">{t("amountChargedTo", { method: paymentLabel })}</span><span>{charged}</span></div>
    </div>}
  </section>;
}
