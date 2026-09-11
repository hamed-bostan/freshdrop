import { getTranslations } from "next-intl/server";

import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatPercent } from "@/src/lib/formatNumber";

import { CustomerReportInsightBanner } from "./CustomerReportInsightBanner";

import type { CustomerInsightsWire } from "./customer-insights-response-schema";

export async function CustomerInsightBanner({ report, locale }: { report: CustomerInsightsWire; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const returningRevenue = report.growth.reduce((sum, point) => sum + point.returningRevenue, 0);
  const share = report.totals.revenue ? returningRevenue / report.totals.revenue : null;
  const repeatValue = report.frequency.averageOrders;
  return <CustomerReportInsightBanner actionLabel={t("viewInsights")}>{share === null ? t("insightEmpty") : <><strong>{t("returningRevenueInsight", { percent: formatPercent(share, locale) })}</strong> {t("averageOrdersInsight", { count: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(repeatValue), revenue: formatMoney(returningRevenue, locale) })}</>}</CustomerReportInsightBanner>;
}
