import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";

/** This application currently has one order channel; keeping it explicit avoids inventing attribution data. */
export async function SalesChannelPanel({ revenue, locale }: { revenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  return (
    <section className="rounded-card-lg border border-border bg-background p-4">
      <h2 className="flex items-center gap-1.5 text-body-b5 text-foreground">{t("salesByChannel")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>
      <div className="mt-7 grid grid-cols-[minmax(7rem,1fr)_minmax(7rem,2fr)_auto_auto] items-center gap-4 text-body-b10">
        <span className="font-medium text-foreground">{t("onlineStore")}</span>
        <span className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken"><span className="block h-full w-full rounded-pill bg-primary" /></span>
        <span className="text-foreground">100%</span>
        <span className="text-end font-medium text-foreground">{formatMoney(revenue, locale)}</span>
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-body-b8"><span>{t("total")}</span><span>100%</span><span className="font-semibold">{formatMoney(revenue, locale)}</span></div>
      <p className="mt-4 text-body-b10 text-muted-foreground">{t("singleChannelNote")}</p>
    </section>
  );
}
