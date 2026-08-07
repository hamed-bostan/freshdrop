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
      <dl className="mt-3 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-body-b10">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-foreground">{row.label}</dt>
            <dd className="min-w-0 truncate text-muted-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
