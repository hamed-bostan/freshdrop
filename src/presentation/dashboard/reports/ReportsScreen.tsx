import { getLocale, getTranslations } from "next-intl/server";
import {
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  MapPin,
  PackageX,
  RefreshCcw,
  Truck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";

type ReportTone = "green" | "red" | "blue" | "violet";

type ReportItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: ReportTone;
  download?: boolean;
};

type ReportGroup = {
  key: string;
  title: string;
  items: ReportItem[];
};

type ReportsScreenProps = {
  from: string;
  to: string;
  isCustomRange: boolean;
  comparisonRange: { from: string; to: string };
};

/**
 * Report directory for store operators.
 *
 * The directory is intentionally navigation rather than a second analytics
 * implementation: every card leads to the existing workflow that owns the data,
 * while the period remains URL-backed and shareable through the same control used
 * by Analytics Overview.
 */
export async function ReportsScreen({ from, to, isCustomRange, comparisonRange }: ReportsScreenProps) {
  const t = await getTranslations("dashReports");
  const tAnalytics = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;

  const groups: ReportGroup[] = [
    {
      key: "sales",
      title: t("sales"),
      items: [
        { key: "payments", title: t("paymentSummary"), description: t("paymentSummaryDescription"), href: "/dashboard/reports/payments", icon: CreditCard, tone: "green" },
        { key: "sales-report", title: t("salesReport"), description: t("salesReportDescription"), href: "/dashboard/analytics", icon: ChartNoAxesCombined, tone: "green" },
      ],
    },
    {
      key: "returns",
      title: t("returnsRefunds"),
      items: [
        { key: "refunds", title: t("refundsReturns"), description: t("refundsReturnsDescription"), href: "/dashboard/reports/refunds", icon: RefreshCcw, tone: "red" },
        { key: "return-items", title: t("returnItems"), description: t("returnItemsDescription"), href: "/dashboard/orders?pipeline=return_requested", icon: PackageX, tone: "red" },
      ],
    },
    {
      key: "delivery",
      title: t("delivery"),
      items: [
        { key: "delivery-performance", title: t("deliveryPerformance"), description: t("deliveryPerformanceDescription"), href: "/dashboard/orders?pipeline=out_for_delivery", icon: Truck, tone: "blue" },
        { key: "delivery-zones", title: t("deliveryZones"), description: t("deliveryZonesDescription"), href: "/dashboard/delivery-slots", icon: MapPin, tone: "blue" },
      ],
    },
    {
      key: "customers",
      title: t("customers"),
      items: [
        { key: "customer-insights", title: t("customerInsights"), description: t("customerInsightsDescription"), href: "/dashboard/customers", icon: UserRound, tone: "violet" },
        { key: "customer-segments", title: t("customerSegments"), description: t("customerSegmentsDescription"), href: "/dashboard/customers", icon: UsersRound, tone: "violet" },
      ],
    },
    {
      key: "exports",
      title: t("exports"),
      items: [
        { key: "export-reports", title: t("exportReports"), description: t("exportReportsDescription"), href: "/api/admin/exports/orders", icon: FileSpreadsheet, tone: "green", download: true },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-body-b7 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker
            presetLabel={tAnalytics("rangeLabel")}
            presetOptions={[
              ...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: tAnalytics(`preset.${preset}`) })),
              { value: CUSTOM_RANGE_VALUE, label: tAnalytics("presetCustom") },
            ]}
            fromLabel={tAnalytics("rangeFrom")}
            toLabel={tAnalytics("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">
            {tAnalytics("comparisonPeriod", {
              from: formatMediumDate(comparisonRange.from, locale),
              to: formatMediumDate(comparisonRange.to, locale),
            })}
          </div>
          <AnalyticsExportMenu
            label={tAnalytics("exportHeading")}
            reports={[
              { resource: "orders", label: tAnalytics("exportOrdersReport") },
              { resource: "products", label: tAnalytics("exportProductsReport") },
              { resource: "customers", label: tAnalytics("exportCustomersReport") },
              { resource: "inventory-movements", label: tAnalytics("exportInventoryReport") },
            ]}
          />
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`report-group-${group.key}`}>
            <h2 id={`report-group-${group.key}`} className="mb-2 text-body-b5 text-foreground">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {group.items.map((item) => <ReportCard key={item.key} item={item} fullWidth={group.items.length === 1} openAria={t("openReportAria", { report: item.title })} />)}
            </div>
          </section>
        ))}
      </div>

      <aside className="flex flex-col gap-4 rounded-card-lg border border-primary/20 bg-accent/60 p-4 sm:flex-row sm:items-center">
        <span className="flex size-14 shrink-0 rotate-[-6deg] items-center justify-center rounded-card-lg border border-primary/20 bg-background text-primary shadow-card">
          <Icon icon={ClipboardList} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-body-b5 text-foreground">{t("needSomethingElse")}</h2>
          <p className="mt-1 text-body-b8 text-muted-foreground">{t("requestDescription")}</p>
        </div>
        <a
          href="mailto:support@yourapp.com?subject=Report%20request"
          className={cn(focusRing, "inline-flex h-10 shrink-0 items-center justify-center rounded-input border border-primary/40 bg-background px-6 text-body-b7 font-semibold text-primary hover:bg-accent")}
        >
          {t("requestReport")}
        </a>
      </aside>
    </div>
  );
}

function ReportCard({ item, openAria, fullWidth }: { item: ReportItem; openAria: string; fullWidth: boolean }) {
  const content = (
    <>
      <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-card-lg", reportToneClass(item.tone))}>
        <Icon icon={item.icon} size="md" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-b5 text-foreground">{item.title}</span>
        <span className="mt-1 block text-body-b8 text-muted-foreground">{item.description}</span>
      </span>
      <Icon icon={ChevronRight} size="sm" className="shrink-0 text-muted-foreground rtl:rotate-180" />
    </>
  );
  const className = cn(focusRing, "group flex min-h-20 items-center gap-4 rounded-card-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-surface-sunken/40", fullWidth && "md:col-span-2");

  if (item.download) return <a href={item.href} download aria-label={openAria} className={className}>{content}</a>;
  return <Link href={item.href} aria-label={openAria} className={className}>{content}</Link>;
}

function reportToneClass(tone: ReportTone): string {
  return {
    green: "bg-accent text-primary",
    red: "bg-error text-destructive",
    blue: "bg-info text-info-foreground",
    violet: "bg-muted text-secondary",
  }[tone];
}
