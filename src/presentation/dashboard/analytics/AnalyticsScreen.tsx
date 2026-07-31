import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Icon } from "@/src/presentation/design-system";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { ExportCsvLink } from "./ExportCsvLink";
import { RevenueChart } from "./RevenueChart";
import type { RevenueRankRow } from "./RevenueRankPanel";
import { TopPerformancePanel } from "./TopPerformancePanel";
import {
  AnalyticsInsights,
  AnalyticsKpiStrip,
  AnalyticsSummaryCards,
  CustomerMixCard,
  OrderHealthCard,
} from "./AnalyticsOverviewPanels";

export const ANALYTICS_RANK_LIMIT = 60;

type AnalyticsScreenProps = {
  analytics: AnalyticsOverviewWire;
  from: string;
  to: string;
  isCustomRange: boolean;
  productSort: RevenueRankSort;
  categorySort: RevenueRankSort;
  productsPage: number;
  categoriesPage: number;
};

export async function AnalyticsScreen({ analytics, from, to, isCustomRange }: AnalyticsScreenProps) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const productRows: RevenueRankRow[] = analytics.topProducts.map((product) => ({
    id: product.productId,
    label: product.name,
    imageUrl: product.imageUrl,
    units: product.units,
    revenue: product.revenue,
    href: `/dashboard/products/${product.productId}/edit`,
  }));
  const categoryRows: RevenueRankRow[] = analytics.topCategories.map((category) => ({
    id: category.categoryId,
    label: category.name,
    units: category.units,
    revenue: category.revenue,
    href: `/dashboard/products?categoryId=${category.categoryId}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("overviewHeading")}</h1>
          <p className="text-body-b10 text-muted-foreground">{t("overviewSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <p className="hidden text-body-b10 text-muted-foreground 2xl:block">{t("rangeCaption", { from: formatMediumDate(analytics.range.from, locale), to: formatMediumDate(analytics.range.to, locale) })}</p>
          <AnalyticsRangePicker
            presetLabel={t("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: t(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: t("presetCustom") }]}
            fromLabel={t("rangeFrom")}
            toLabel={t("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <a href="#reports" className="inline-flex h-10 items-center gap-2 rounded-input border border-border px-4 text-body-b8 text-foreground hover:bg-muted"><Icon icon={Download} size="xs" />{t("exportHeading")}</a>
        </div>
      </header>

      <AnalyticsKpiStrip analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(18rem,0.9fr)]">
        <RevenueChart
          points={analytics.revenueSeries}
          previousPoints={analytics.previousSeries}
          previousYearPoints={analytics.previousYearSeries}
          granularity={analytics.granularity}
          range={analytics.range}
          previousRange={analytics.previousRange}
          previousYearRange={analytics.previousYearRange}
        />
        <AnalyticsInsights analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(22rem,1fr)]">
        <TopPerformancePanel products={productRows} categories={categoryRows} />
        <CustomerMixCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <OrderHealthCard analytics={analytics} />
        <AnalyticsSummaryCards analytics={analytics} />
      </div>

      <section id="reports" className="rounded-card-lg border border-border bg-background p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
          <h2 className="flex items-center gap-2 text-body-b8"><Icon icon={Download} size="xs" />{t("exportReports")}</h2>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("exportBody")}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ExportCsvLink compact resource="orders" label={t("exportOrdersReport")} />
            <ExportCsvLink compact resource="products" label={t("exportProductsReport")} />
            <ExportCsvLink compact resource="customers" label={t("exportCustomersReport")} />
            <ExportCsvLink compact resource="inventory-movements" label={t("exportInventoryReport")} />
          </div>
        </div>
      </section>
    </div>
  );
}
