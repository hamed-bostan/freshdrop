import { ArrowDown, ArrowUp, Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { percentChange } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Icon } from "@/src/presentation/design-system";

export async function SalesInsightBanner({ currentRevenue, previousRevenue, topCategory, locale }: { currentRevenue: number; previousRevenue: number; topCategory?: string; locale: Locale }) {
  const t = await getTranslations("dashReports");
  const change = percentChange(currentRevenue, previousRevenue);
  const increasing = (change ?? 0) >= 0;
  const percent = change === null ? "" : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(change * 100));
  return (
    <aside className="flex flex-col gap-3 rounded-card-lg border border-primary/20 bg-accent/45 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span>
      <p className="flex-1 text-body-b7 text-foreground">{change === null ? t("insightCurrentPeriod") : <><span className="font-semibold">{t(increasing ? "insightIncrease" : "insightDecrease", { percent })}</span>{topCategory ? ` ${t("insightCategory", { category: topCategory })}` : null}</>}</p>
      {change !== null ? <span className={increasing ? "text-success-foreground" : "text-destructive"}><Icon icon={increasing ? ArrowUp : ArrowDown} size="sm" /></span> : null}
    </aside>
  );
}
