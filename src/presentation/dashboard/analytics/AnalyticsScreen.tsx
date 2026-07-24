import { getLocale, getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import { paginateArray } from "@/src/domain/entities/Pagination";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { ExportCsvLink } from "./ExportCsvLink";
import { OrderStatusBreakdown } from "./OrderStatusBreakdown";
import { RankingsTable } from "./RankingsTable";
import { RevenueChart } from "./RevenueChart";
import { RevenueRankSortSelect } from "./RevenueRankSortSelect";
import type { RevenueRankRow } from "./RevenueRankPanel";

/**
 * How many rows the ranking reads fetch — the whole budget the two tables below
 * page through. Well above what any store's catalog needs "top by revenue"
 * ranked into a single period; see `parseRankLimit`'s ceiling for the hard cap.
 */
export const ANALYTICS_RANK_LIMIT = 60;

/** Rows per page of a ranking table — smaller than a management list's default, since these are read for the ordering, not searched. */
export const RANK_PAGE_SIZE = 10;

type AnalyticsScreenProps = {
  /** Fetched with `rankLimit=ANALYTICS_RANK_LIMIT`, unlike the overview's five-row request. */
  analytics: AnalyticsOverviewWire;
  from: string;
  to: string;
  isCustomRange: boolean;
  productSort: RevenueRankSort;
  categorySort: RevenueRankSort;
  /** 1-based; which slice of the fetched ranking each table is showing right now. */
  productsPage: number;
  categoriesPage: number;
};

/**
 * The analytics deep-dive: everything the overview doesn't have room for.
 *
 * Presentational and a server component, same discipline as
 * `DashboardOverviewScreen` — the period lives in the URL, changing it is a
 * navigation, and every figure on the page describes the one range the picker
 * names. It shares that screen's single `GET /api/admin/analytics` fetch rather
 * than adding an endpoint of its own; the only difference is `rankLimit`, which
 * asks the same aggregate query for more rows than the overview's compact panels
 * need.
 *
 * The two ranking tables page over that fetched (capped) array with
 * `paginateArray` rather than a real database offset — `topProducts`/
 * `topCategories` already promise "the `limit` highest-ranked", and a store
 * doesn't have a meaningful use for "products ranked 61st and below by revenue
 * this quarter". If that ever stops being true, the fix is a bigger cap here,
 * not a new paged endpoint.
 */
export async function AnalyticsScreen({
  analytics,
  from,
  to,
  isCustomRange,
  productSort,
  categorySort,
  productsPage,
  categoriesPage,
}: AnalyticsScreenProps) {
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

  const productsPageResult = paginateArray(productRows, {
    page: productsPage,
    pageSize: RANK_PAGE_SIZE,
  });
  const categoriesPageResult = paginateArray(categoryRows, {
    page: categoriesPage,
    pageSize: RANK_PAGE_SIZE,
  });

  const revenueRankSortOptions: { value: RevenueRankSort; label: string }[] = [
    { value: "revenue", label: t("sortByRevenue") },
    { value: "units", label: t("sortByUnits") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("pageHeading")}</h1>
          <p className="text-body-b6 text-muted-foreground">
            {t("rangeCaption", {
              from: formatMediumDate(analytics.range.from, locale),
              to: formatMediumDate(analytics.range.to, locale),
            })}
          </p>
        </div>

        <AnalyticsRangePicker
          presetLabel={t("rangeLabel")}
          presetOptions={[
            ...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: t(`preset.${preset}`) })),
            { value: CUSTOM_RANGE_VALUE, label: t("presetCustom") },
          ]}
          fromLabel={t("rangeFrom")}
          toLabel={t("rangeTo")}
          from={from}
          to={to}
          isCustom={isCustomRange}
        />
      </div>

      <RevenueChart
        points={analytics.revenueSeries}
        previousPoints={analytics.previousSeries}
        previousYearPoints={analytics.previousYearSeries}
        granularity={analytics.granularity}
        range={analytics.range}
        previousRange={analytics.previousRange}
        previousYearRange={analytics.previousYearRange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body-b5 text-foreground">{t("topProducts")}</h2>
            <RevenueRankSortSelect
              paramName="productSort"
              value={productSort}
              defaultValue="revenue"
              label={t("sortLabel")}
              options={revenueRankSortOptions}
            />
          </div>
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
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body-b5 text-foreground">{t("topCategories")}</h2>
            <RevenueRankSortSelect
              paramName="categorySort"
              value={categorySort}
              defaultValue="revenue"
              label={t("sortLabel")}
              options={revenueRankSortOptions}
            />
          </div>
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
      </div>

      <OrderStatusBreakdown breakdown={analytics.statusBreakdown} />

      <section className="rounded-card-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-body-b8 text-muted-foreground">{t("exportHeading")}</span>
          <ExportCsvLink resource="orders" label={t("exportOrders")} />
          <ExportCsvLink resource="products" label={t("exportProducts")} />
          <ExportCsvLink resource="customers" label={t("exportCustomers")} />
        </div>
      </section>
    </div>
  );
}
