import { UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import { formatMoney } from "@/src/lib/formatMoney";

import { PANEL_CLASS, PanelHeading } from "./PanelHeading";

export function CustomerSummaryPanel({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();

  const rows = [
    { label: t("email"), value: customer.email ?? t("notProvided") },
    { label: t("customerGroup"), value: t(`role.${customer.role}`) },
    { label: t("phone"), value: customer.phone || t("notProvided") },
    { label: t("walletBalance"), value: formatMoney(customer.wallet.balance, locale) },
  ];

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={UserRound}>{t("customerSummary")}</PanelHeading>
      <dl className="mt-5 flex flex-col divide-y divide-border text-body-b8">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 break-all text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
