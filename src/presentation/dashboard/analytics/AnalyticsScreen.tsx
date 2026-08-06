import { getLocale, getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS, REVENUE_RANK_SORTS, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import { paginateArray } from "@/src/domain/entities/Pagination";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import { AnalyticsExportMenu } from "./AnalyticsExportMenu";
import {
  AnalyticsInsights,
  AnalyticsKpiStrip,
  CustomerMixCard,
  OrderHealthCard,
  PriorityActionsCard,
  QuickAccessCard,
} from "./AnalyticsOverviewPanels";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { RankingsTable } from "./RankingsTable";
import { RevenueChart } from "./RevenueChart";
import { RevenueRankPanel, type RevenueRankRow } from "./RevenueRankPanel";

export const ANALYTICS_RANK_LIMIT = 60;
const TEASER_ROW_COUNT = 5;
const RANKING_PAGE_SIZE = 10;

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

export async function AnalyticsScreen({ analytics, from, to, isCustomRange, productSort, categorySort, productsPage, categoriesPage }: AnalyticsScreenProps) {
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
    href: `/dashboard/categories/${category.categoryId}/edit`,
  }));

  const sortOptions = REVENUE_RANK_SORTS.map((sort) => ({ value: sort, label: t(sort === "revenue" ? "sortByRevenue" : "sortByUnits") }));
  const productsPageResult = paginateArray(productRows, { page: productsPage, pageSize: RANKING_PAGE_SIZE });
  const categoriesPageResult = paginateArray(categoryRows, { page: categoriesPage, pageSize: RANKING_PAGE_SIZE });

  return (
    <div className="flex flex-col gap-4 pb-2">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("overviewHeading")}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("metricsOverviewSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker
            presetLabel={t("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: t(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: t("presetCustom") }]}
            fromLabel={t("rangeFrom")}
            toLabel={t("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">
            {t("comparisonPeriod", { from: formatMediumDate(analytics.previousRange.from, locale), to: formatMediumDate(analytics.previousRange.to, locale) })}
          </div>
          <AnalyticsExportMenu
            label={t("exportHeading")}
            reports={[
              { resource: "orders", label: t("exportOrdersReport") },
              { resource: "products", label: t("exportProductsReport") },
              { resource: "customers", label: t("exportCustomersReport") },
              { resource: "inventory-movements", label: t("exportInventoryReport") },
            ]}
            from={from}
            to={to}
          />
        </div>
      </header>

      <AnalyticsKpiStrip analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(20rem,0.95fr)]">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CustomerMixCard analytics={analytics} />
        <OrderHealthCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueRankPanel
          heading={t("topProducts")}
          rows={productRows.slice(0, TEASER_ROW_COUNT)}
          emptyLabel={t("noSales")}
          unitsLabel={(units) => t("unitsSold", { units })}
          sort={productSort}
          sortParamName="productSort"
          sortLabel={t("sortLabel")}
          sortOptions={sortOptions}
          viewAllHref="/dashboard/products"
          viewAllLabel={t("viewAllProducts")}
        />
        <RevenueRankPanel
          heading={t("topCategories")}
          rows={categoryRows.slice(0, TEASER_ROW_COUNT)}
          emptyLabel={t("noSales")}
          unitsLabel={(units) => t("unitsSold", { units })}
          sort={categorySort}
          sortParamName="categorySort"
          sortLabel={t("sortLabel")}
          sortOptions={sortOptions}
          viewAllHref="/dashboard/categories"
          viewAllLabel={t("viewAllCategories")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RankingsTable
          heading={t("topProducts")}
          page={productsPageResult}
          pageParamName="productsPage"
          emptyLabel={t("noSales")}
          colRankLabel={t("colRank")}
          colNameLabel={t("colProduct")}
          colUnitsLabel={t("colUnits")}
          colRevenueLabel={t("colRevenue")}
        />
        <RankingsTable
          heading={t("topCategories")}
          page={categoriesPageResult}
          pageParamName="categoriesPage"
          emptyLabel={t("noSales")}
          colRankLabel={t("colRank")}
          colNameLabel={t("colCategory")}
          colUnitsLabel={t("colUnits")}
          colRevenueLabel={t("colRevenue")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PriorityActionsCard analytics={analytics} />
        <QuickAccessCard />
      </div>
    </div>
  );
}
