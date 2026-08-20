import { getTranslations } from "next-intl/server";

import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";

/** This application currently has one order channel; keeping it explicit avoids inventing attribution data. */
export async function SalesChannelPanel({ revenue, locale }: { revenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  return (
    <section className="rounded-card-lg border border-border bg-background p-4">
      <h2 className="text-body-b5 text-foreground">{t("salesByChannel")}</h2>
      <div className="mt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-body-b10">
          <span className="font-medium text-foreground">{t("onlineStore")}</span>
          <span className="text-end text-foreground">100%</span>
          <span className="min-w-20 text-end font-medium text-foreground">{formatMoney(revenue, locale)}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
          <span className="block h-full w-full rounded-pill bg-primary" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-border pt-4 text-body-b8">
        <span>{t("total")}</span>
        <span className="text-end">100%</span>
        <span className="min-w-20 text-end font-semibold">{formatMoney(revenue, locale)}</span>
      </div>
    </section>
  );
}
