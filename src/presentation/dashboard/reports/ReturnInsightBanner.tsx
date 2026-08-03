import { getTranslations } from "next-intl/server";
import { Lightbulb } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";
import type { RefundReportWire } from "./refund-report-response-schema";

export async function ReturnInsightBanner({ report, locale, recovery = false }: { report: RefundReportWire; locale: Locale; recovery?: boolean }) {
  const t = await getTranslations("dashRefundReport");
  const resolutionRate = report.totals.requestedReturns + report.totals.returnedOrders > 0 ? report.totals.returnedOrders / (report.totals.requestedReturns + report.totals.returnedOrders) : null;
  const recoverableRate = report.totals.returnedItems > 0 ? Math.max(0, report.totals.returnedItems - report.totals.requestedReturns) / report.totals.returnedItems : null;
  return <aside className={cn("flex flex-col gap-3 rounded-card-lg border border-primary/20 bg-accent/45 px-4 py-2 sm:flex-row sm:items-center", recovery ? "sm:justify-between" : "gap-4")}>
    <div className="flex items-center gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span><p className="text-body-b7 text-foreground">{recovery ? recoverableRate === null ? t("insightEmpty") : <><strong>{t("recoverableItemsInsight", { percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(recoverableRate) })}</strong> {t("pendingRecoveryInsight", { count: report.totals.requestedReturns })}</> : resolutionRate === null ? t("insightEmpty") : <><strong>{t("resolvedInsight", { percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(resolutionRate) })}</strong> {t("refundedInsight", { amount: formatMoney(report.totals.refundedAmount, locale) })}</>}</p></div>
    {recovery && <Link href="/dashboard/orders" className="inline-flex h-8 shrink-0 items-center justify-center rounded-input border border-primary/60 bg-background px-5 text-body-b10 font-semibold text-primary hover:bg-accent">{t("reviewPendingItems")}</Link>}
  </aside>;
}
