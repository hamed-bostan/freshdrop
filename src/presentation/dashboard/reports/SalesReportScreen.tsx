import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import type { ComparisonMode } from "@/src/lib/api/analytics-params";
import { formatMoney } from "@/src/lib/formatMoney";
import type { AnalyticsOverviewWire } from "../analytics/analytics-response-schema";
import { ReportHeader } from "./ReportHeader";
import { SalesCategoryPanel } from "./SalesCategoryPanel";
import { SalesChannelPanel } from "./SalesChannelPanel";
import { SalesInsightBanner } from "./SalesInsightBanner";
import { SalesMetricGrid } from "./SalesMetricGrid";
import { SalesTrendChart } from "./SalesTrendChart";
import { TopSellingProductsTable } from "./TopSellingProductsTable";

type Props = { analytics: AnalyticsOverviewWire; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };

export async function SalesReportScreen({ analytics, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashReports"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("heading")} currentLabel={t("salesReport")} title={t("salesReport")} subtitle={t("salesReportSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={analytics.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }, { resource: "products", label: ta("exportProductsReport") }]} />
    <SalesMetricGrid analytics={analytics} locale={locale} labels={{ revenue: ta("kpiNetRevenue"), orders: ta("kpiOrders"), averageOrder: ta("kpiAverageOrder"), units: ta("kpiUnitsSold"), comparison: ta("vsPreviousPeriod"), current: ta("currentPeriod") }} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"><SalesTrendChart analytics={analytics} locale={locale} labels={{ heading: t("salesOverTime"), netSales: ta("kpiNetRevenue"), orders: ta("kpiOrders"), daily: t("daily"), weekly: t("weekly"), monthly: t("monthly"), empty: ta("chartEmpty") }} /><SalesChannelPanel revenue={analytics.totals.revenue} locale={locale} /></div>
    <SalesInsightBanner currentRevenue={analytics.totals.revenue} previousRevenue={analytics.previousTotals.revenue} topCategory={analytics.topCategories[0]?.name} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(25rem,1.2fr)_minmax(0,2fr)]"><SalesCategoryPanel categories={analytics.topCategories} totalRevenue={analytics.totals.revenue} locale={locale} /><TopSellingProductsTable products={analytics.topProducts} totalRevenue={analytics.totals.revenue} locale={locale} /></div>
    <p className="sr-only">{t("netSalesDefinition", { amount: formatMoney(analytics.totals.revenue, locale) })}</p>
  </div>;
}
