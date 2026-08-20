import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { TopCategory } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";

export async function SalesCategoryPanel({ categories, totalRevenue, locale }: { categories: TopCategory[]; totalRevenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  const peak = Math.max(...categories.map((category) => category.revenue), 1);
  return (
    <section className="flex min-h-64 flex-col rounded-card-lg border border-border bg-background p-4">
      <h2 className="flex items-center gap-1.5 text-body-b5 text-foreground">{t("salesByCategory")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>
      {categories.length ? <div className="mt-3 space-y-3">{categories.map((category) => {
        const share = totalRevenue > 0 ? category.revenue / totalRevenue * 100 : 0;
        return <div key={category.categoryId}><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-body-b10"><span className="truncate font-medium text-foreground">{category.name}</span><span className="text-end font-medium text-foreground">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(share)}%</span><span className="min-w-20 whitespace-nowrap text-end text-muted-foreground">{formatMoney(category.revenue, locale)}</span></div><div className="mt-2 h-1 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden><span className="block h-full rounded-pill bg-primary" style={{ width: `${Math.max(category.revenue / peak * 100, 3)}%` }} /></div></div>;
      })}</div> : <p className="flex flex-1 items-center justify-center text-body-b7 text-muted-foreground">{t("noSales")}</p>}
    </section>
  );
}
