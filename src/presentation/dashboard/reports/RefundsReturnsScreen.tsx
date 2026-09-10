import { getLocale, getTranslations } from "next-intl/server";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { ComparisonMode } from "@/src/lib/api/analytics-params";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { DashboardViewTab, DashboardViewTabs } from "@/src/presentation/dashboard/DashboardViewTabs";

import { InspectionRecoveryQueue } from "./InspectionRecoveryQueue";
import { RecoveryBreakdownPanels } from "./RecoveryBreakdownPanels";
import { RefundOverviewMetricGrid } from "./RefundOverviewMetricGrid";
import { RefundTrendChart } from "./RefundTrendChart";
import { ReportHeader } from "./ReportHeader";
import { ReturnCasesTable, type ReturnCaseRow } from "./ReturnCasesTable";
import { ReturnInsightBanner } from "./ReturnInsightBanner";
import { ReturnMetricGrid } from "./ReturnMetricGrid";
import { ReturnProcessingStatus } from "./ReturnProcessingStatus";
import { ReturnReasonsPanel } from "./ReturnReasonsPanel";

import type { RefundReportWire } from "./refund-report-response-schema";

type RefundView = "overview" | "items";
type Props = { report: RefundReportWire; customers: CustomerOrderSummary[]; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode; view: RefundView; queryString: string };

export async function RefundsReturnsScreen({ report, customers, from, to, isCustomRange, compareMode, view, queryString }: Props) {
  const t = await getTranslations("dashRefundReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale();
  const customerById = new Map(customers.map((item) => [item.userId, item]));
  const rows: ReturnCaseRow[] = report.cases.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    orderNumber: `#${item.orderNumber}`,
    productName: item.productName ?? t("notAvailable"),
    productImageUrl: item.productImageUrl,
    customer: customerById.get(item.userId)?.name ?? item.userId,
    reason: item.reason ?? (item.kind ? t(`kind.${item.kind}`) : t("notAvailable")),
    amount: formatMoney(item.amount, locale),
    status: item.status,
    statusLabel: t(`caseStatus.${item.status}`),
    resolution: t(`resolution.${item.status}`),
    date: `${formatOrderDateShort(item.activityAt, locale)} · ${formatOrderTime(item.activityAt, locale)}`,
    returnStatus: item.returnStatus,
    condition: item.condition,
    recoveryDecision: item.recoveryDecision,
  }));
  const tableLabels = {
    search: t("searchReturns"), filterStatus: t("filterStatus"), status: t("statusColumn"), all: t("filterAll"), product: t("product"), order: t("order"), customer: t("customer"), reason: t("reason"), amount: t("amountColumn"), resolution: t("resolutionColumn"), date: t("date"), viewAll: t("viewAll"), moreActions: t("moreActions"), empty: t("noCases"),
  };
  const recoveryLabels = { heading: t("inspectionRecoveryQueue"), search: t("searchReturns"), allConditions: t("allConditions"), allStatuses: t("allStatuses"), viewAll: t("viewAll"), product: t("product"), order: t("order"), condition: t("condition"), received: t("received"), inspectionStatus: t("inspectionStatus"), recoveryDecision: t("recoveryDecision"), value: t("valueColumn"), action: t("action"), awaitingInspection: t("awaitingInspection"), inspected: t("inspected"), inReview: t("inReview"), pending: t("pending"), restock: t("restock"), discount: t("discount"), returnToSupplier: t("returnToSupplier"), dispose: t("dispose"), inspect: t("inspect"), confirm: t("confirm"), review: t("review"), complete: t("complete"), showing: t("showingOpenItems", { first: "__FIRST__", last: "__LAST__", total: "__TOTAL__" }).replace("__FIRST__", "{first}").replace("__LAST__", "{last}").replace("__TOTAL__", "{total}"), previousPage: t("previousPage"), nextPage: t("nextPage"), unopened: t("unopened"), resellable: t("resellable"), damaged: t("damaged"), expired: t("expired"), missingParts: t("missingParts"), pendingDecision: t("pendingDecision"), notRecorded: t("notRecorded") };

  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-5 md:gap-6">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("combinedSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} responsiveActions />
    <DashboardViewTabs label={t("viewTabsLabel")}><ReportTab active={view === "overview"} href={viewHref(queryString, "overview")} label={t("overview")} /><ReportTab active={view === "items"} href={viewHref(queryString, "items")} label={t("itemsRecovery")} /></DashboardViewTabs>
    {view === "overview" ? <>
      <RefundOverviewMetricGrid report={report} locale={locale} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(17rem,.72fr)_minmax(17rem,.72fr)]"><RefundTrendChart points={report.series} previousPoints={report.previousSeries} granularity={report.granularity} range={report.range} previousRange={report.previousRange} title={t("overviewTrend")} defaultMetric="amount" /><ReturnReasonsPanel reasons={report.reasons} total={report.totals.refundActivity} locale={locale} /><ReturnProcessingStatus totals={report.totals} locale={locale} /></div>
      <ReturnInsightBanner report={report} locale={locale} />
      <ReturnCasesTable rows={rows} labels={{ ...tableLabels, heading: t("recentCases") }} viewAllHref={viewHref(queryString, "items")} />
    </> : <>
      <ReturnMetricGrid report={report} locale={locale} />
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(40rem,1fr)]"><RefundTrendChart points={report.series} previousPoints={report.previousSeries} granularity={report.granularity} range={report.range} previousRange={report.previousRange} title={t("returnedItemsProcessed")} /><RecoveryBreakdownPanels report={report} locale={locale} /></div>
      <ReturnInsightBanner report={report} locale={locale} recovery />
      <InspectionRecoveryQueue rows={rows} labels={recoveryLabels} viewAllHref="/dashboard/orders" />
    </>}
  </div>;
}

function ReportTab({ active, href, label }: { active: boolean; href: string; label: string }) {
  return <DashboardViewTab active={active} href={href}>{label}</DashboardViewTab>;
}

function viewHref(queryString: string, view: RefundView): string {
  const params = new URLSearchParams(queryString);
  if (view === "overview") params.delete("view"); else params.set("view", view);
  const query = params.toString();
  return `/dashboard/reports/refunds${query ? `?${query}` : ""}`;
}
