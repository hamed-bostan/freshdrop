import { ChartNoAxesCombined, ClipboardList, CreditCard, FileSpreadsheet, MapPin, RefreshCcw, Truck, UserRound, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button, Icon } from "@/src/presentation/design-system";

import { ReportDirectoryCard, type ReportDirectoryItem } from "./ReportDirectoryCard";

type ReportGroup = { id: string; title: string; items: ReportDirectoryItem[] };
export async function ReportsScreen() {
  const t = await getTranslations("dashReports");
  const groups: ReportGroup[] = [
    { id: "sales", title: t("sales"), items: [
      { id: "payments", title: t("paymentSummary"), description: t("paymentSummaryDescription"), href: "/dashboard/reports/payments", icon: CreditCard, tone: "green" },
      { id: "sales-report", title: t("salesReport"), description: t("salesReportDescription"), href: "/dashboard/reports/sales", icon: ChartNoAxesCombined, tone: "green" },
    ] },
    { id: "returns", title: t("returnsRefunds"), items: [
      { id: "refunds", title: t("refundsReturns"), description: t("refundsReturnsDescription"), href: "/dashboard/reports/refunds", icon: RefreshCcw, tone: "red" },
    ] },
    { id: "delivery", title: t("delivery"), items: [
      { id: "delivery-performance", title: t("deliveryPerformance"), description: t("deliveryPerformanceDescription"), href: "/dashboard/reports/delivery-performance", icon: Truck, tone: "blue" },
      { id: "delivery-zones", title: t("deliveryZones"), description: t("deliveryZonesDescription"), href: "/dashboard/reports/delivery-zones", icon: MapPin, tone: "blue" },
    ] },
    { id: "customers", title: t("customers"), items: [
      { id: "customer-insights", title: t("customerInsights"), description: t("customerInsightsDescription"), href: "/dashboard/reports/customer-insights", icon: UserRound, tone: "violet" },
      { id: "customer-segments", title: t("customerSegments"), description: t("customerSegmentsDescription"), href: "/dashboard/reports/customer-segments", icon: UsersRound, tone: "violet" },
    ] },
    { id: "exports", title: t("exports"), items: [
      { id: "export-reports", title: t("exportReports"), description: t("exportReportsDescription"), href: "/dashboard/reports/exports", icon: FileSpreadsheet, tone: "green" },
    ] },
  ];

  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 md:gap-9">
    <header className="border-b border-border/70 pb-5 md:pb-6"><h1 className="dashboard-page-title">{t("heading")}</h1><p className="mt-1.5 max-w-2xl text-body-b7 text-muted-foreground">{t("subtitle")}</p></header>
    <div className="flex flex-col gap-6 md:gap-7">{groups.map((group) => <section key={group.id} aria-labelledby={`report-group-${group.id}`}><h2 id={`report-group-${group.id}`} className="mb-3 text-body-b5 text-foreground">{group.title}</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">{group.items.map((item) => <ReportDirectoryCard key={item.id} item={item} fullWidth={group.items.length === 1} openAria={t("openReportAria", { report: item.title })} />)}</div></section>)}</div>
    <aside className="relative flex flex-col gap-4 overflow-hidden rounded-card-lg border border-primary/20 bg-accent/60 p-5 sm:flex-row sm:items-center md:p-6"><span aria-hidden="true" className="absolute -end-12 -top-16 size-40 rounded-full border-[24px] border-primary/5" /><span className="relative flex size-14 shrink-0 rotate-[-6deg] items-center justify-center rounded-card-lg border border-primary/20 bg-background text-primary shadow-card"><Icon icon={ClipboardList} size="md" /></span><div className="relative min-w-0 flex-1"><h2 className="text-heading-h3 text-foreground">{t("needSomethingElse")}</h2><p className="mt-1 text-body-b8 text-muted-foreground">{t("requestDescription")}</p></div><Button asChild variant="outline" size="sm" className="relative shrink-0 border-primary/30 bg-background px-6 text-body-b7"><a href="mailto:support@yourapp.com?subject=Report%20request">{t("requestReport")}</a></Button></aside>
  </div>;
}
