import { ExternalLink } from "lucide-react";
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
    <section className="flex min-h-[480px] min-w-0 flex-col rounded-card-lg border border-border bg-background p-4 md:p-6 xl:p-4">
      <h2 className="text-heading-h3">{t("purchaseFrequency")}</h2>
      <div className="mt-3 divide-y divide-border text-body-b10">
        {rows.map((row) => {
          const share = percent(row.value);
          return (
            <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_4.5rem_2rem] items-center gap-x-3 py-4 first:pt-2">
              <span className="font-semibold">{row.label}</span>
              <span className="text-end">{formatPercent(share, locale)}</span>
              <span className="text-end font-medium">{formatNumber(row.value, locale)}</span>
              <span className="col-span-3 mt-1 h-1 overflow-hidden rounded-pill bg-surface-sunken">
                <span className="block h-full rounded-pill bg-primary" style={{ width: `${share * 100}%` }} />
              </span>
            </div>
          );
        })}
      </div>
      <dl className="mt-2 grid grid-cols-2 border-t border-border py-4">
        <div className="pe-4">
          <dt className="text-body-b10 text-muted-foreground">{t("averageOrders")}</dt>
          <dd className="mt-0.5 text-heading-h4">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(frequency.averageOrders)}</dd>
        </div>
        <div className="ps-4">
          <dt className="text-body-b10 text-muted-foreground">{t("averageDays")}</dt>
          <dd className="mt-0.5 text-heading-h4">{frequency.averageDaysBetweenOrders === null ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(frequency.averageDaysBetweenOrders)}</dd>
        </div>
      </dl>
      <Link href="/dashboard/customers" className={cn(focusRing, "mt-auto flex items-center justify-end gap-1 border-t border-border pt-3 text-body-b8 text-primary")}>
        {t("viewCustomerDetails")}
        <Icon icon={ExternalLink} size="xs" />
      </Link>
    </section>
  );
}
