import { ExternalLink, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { PurchaseFrequency } from "@/src/domain/entities/CustomerInsightsReport";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

export async function PurchaseFrequencyPanel({ frequency, locale }: { frequency: PurchaseFrequency; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const rows = [
    { label: t("oneOrder"), value: frequency.oneOrder },
    { label: t("twoToThreeOrders"), value: frequency.twoToThreeOrders },
    { label: t("fourToSixOrders"), value: frequency.fourToSixOrders },
    { label: t("sevenPlusOrders"), value: frequency.sevenPlusOrders },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const percent = (value: number) => total ? value / total : 0;

  return (
    <section className="flex min-w-0 flex-col rounded-card-md border border-border bg-background px-4 py-3">
      <h2 className="flex items-center gap-1.5 text-body-b5">
        {t("purchaseFrequency")}
        <Icon icon={Info} size="xs" className="text-muted-foreground" />
      </h2>
      <div className="mt-1 grid grid-cols-[5.25rem_minmax(7rem,1fr)_4.5rem_4.5rem] items-center gap-x-3 text-body-b10">
        <span className="text-muted-foreground">{t("ordersColumn")}</span>
        <span />
        <span className="text-end text-muted-foreground">{t("percentCustomersColumn")}</span>
        <span className="text-end text-muted-foreground">{t("customers")}</span>
        {rows.map((row) => {
          const share = percent(row.value);
          return (
            <div key={row.label} className="col-span-4 grid grid-cols-subgrid items-center py-1">
              <span>{row.label}</span>
              <span className="h-1 overflow-hidden rounded-pill bg-surface-sunken">
                <span className="block h-full rounded-pill bg-primary" style={{ width: `${Math.min(share * 200, 100)}%` }} />
              </span>
              <span className="text-end">{formatPercent(share, locale)}</span>
              <span className="text-end font-medium">{formatNumber(row.value, locale)}</span>
            </div>
          );
        })}
      </div>
      <dl className="mt-2 grid grid-cols-2 rounded-card-md border border-border px-4 py-2">
        <div className="border-e border-border pe-4">
          <dt className="text-body-b10 text-muted-foreground">{t("averageOrders")}</dt>
          <dd className="mt-0.5 text-heading-h4">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(frequency.averageOrders)}</dd>
        </div>
        <div className="ps-4">
          <dt className="text-body-b10 text-muted-foreground">{t("averageDays")}</dt>
          <dd className="mt-0.5 text-heading-h4">{frequency.averageDaysBetweenOrders === null ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(frequency.averageDaysBetweenOrders)}</dd>
        </div>
      </dl>
      <Link href="/dashboard/customers" className={cn(focusRing, "mt-2 flex items-center justify-end gap-1 border-t border-border pt-2 text-body-b8 text-primary")}>
        {t("viewCustomerDetails")}
        <Icon icon={ExternalLink} size="xs" />
      </Link>
    </section>
  );
}
