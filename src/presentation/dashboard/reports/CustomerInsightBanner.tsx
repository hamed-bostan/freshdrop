import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatPercent } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

import type { CustomerInsightsWire } from "./customer-insights-response-schema";

export async function CustomerInsightBanner({ report, locale }: { report: CustomerInsightsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const returningRevenue = report.growth.reduce((sum, point) => sum + point.returningRevenue, 0);
  const share = report.totals.revenue ? returningRevenue / report.totals.revenue : null;
  const repeatValue = report.frequency.averageOrders;
  return <aside className="flex flex-col gap-3 rounded-card-lg border border-primary/20 bg-accent/45 px-4 py-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span><p className="text-body-b7">{share === null ? t("insightEmpty") : <><strong>{t("returningRevenueInsight", { percent: formatPercent(share, locale) })}</strong> {t("averageOrdersInsight", { count: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(repeatValue), revenue: formatMoney(returningRevenue, locale) })}</>}</p></div><Link href="/dashboard/customers" className="inline-flex h-8 shrink-0 items-center rounded-input border border-primary/60 bg-background px-5 text-body-b10 font-semibold text-primary hover:bg-accent">{t("viewInsights")}</Link></aside>;
}
