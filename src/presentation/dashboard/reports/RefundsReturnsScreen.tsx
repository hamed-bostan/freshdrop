import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { RefundTrendChart } from "./RefundTrendChart";
import type { RefundReportWire } from "./refund-report-response-schema";
import { ReturnCasesTable, type ReturnCaseRow } from "./ReturnCasesTable";
import { ReturnInsightBanner } from "./ReturnInsightBanner";
import { ReturnMetricGrid } from "./ReturnMetricGrid";
import { ReturnProcessingStatus } from "./ReturnProcessingStatus";
import { ReturnReasonsPanel } from "./ReturnReasonsPanel";

type Props = { report: RefundReportWire; customers: CustomerOrderSummary[]; from: string; to: string; isCustomRange: boolean };

export async function RefundsReturnsScreen({ report, customers, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashRefundReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale() as Locale;
  const customerById = new Map(customers.map((item) => [item.userId, item]));
  const rows: ReturnCaseRow[] = report.cases.map((item) => ({
    id: item.id, orderId: item.orderId, orderNumber: `#${item.orderNumber}`, productName: item.productName ?? t("notAvailable"),
    productImageUrl: item.productImageUrl, customer: customerById.get(item.userId)?.name ?? item.userId,
    reason: item.reason ?? (item.kind ? t(`kind.${item.kind}`) : t("notAvailable")), amount: formatMoney(item.amount, locale),
    status: item.status, statusLabel: t(`caseStatus.${item.status}`), date: `${formatOrderDateShort(item.activityAt, locale)} · ${formatOrderTime(item.activityAt, locale)}`,
  }));

  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground"><Link href="/dashboard/reports" className="hover:text-foreground">{t("reports")}</Link><ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden /><span className="font-medium text-foreground">{t("returnItemsHeading")}</span></nav>
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-heading-h2">{t("returnItemsHeading")}</h1><p className="mt-1 text-body-b10 text-muted-foreground">{t("returnItemsSubtitle")}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">{ta("comparisonPeriod", { from: formatMediumDate(report.previousRange.from, locale), to: formatMediumDate(report.previousRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "orders", label: ta("exportOrdersReport") }]} /></div></header>
    <ReturnMetricGrid report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,.85fr)]"><RefundTrendChart points={report.series} previousPoints={report.previousSeries} granularity={report.granularity} range={report.range} previousRange={report.previousRange} /><ReturnReasonsPanel reasons={report.reasons} total={report.totals.refundCount} locale={locale} /></div>
    <ReturnInsightBanner report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(17rem,.7fr)]"><ReturnCasesTable rows={rows} labels={{ heading: t("returnQueue"), search: t("searchReturns"), status: t("filterStatus"), all: t("filterAll"), product: t("product"), order: t("order"), customer: t("customer"), reason: t("reason"), amount: t("amountColumn"), received: t("date"), action: t("action"), view: t("view"), empty: t("noCases") }} /><ReturnProcessingStatus totals={report.totals} locale={locale} /></div>
  </div>;
}
