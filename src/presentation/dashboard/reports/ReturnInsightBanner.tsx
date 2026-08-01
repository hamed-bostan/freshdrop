import { getTranslations } from "next-intl/server";
import { Lightbulb } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";
import type { RefundReportWire } from "./refund-report-response-schema";

export async function ReturnInsightBanner({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const resolutionRate = report.totals.requestedReturns + report.totals.returnedOrders > 0 ? report.totals.returnedOrders / (report.totals.requestedReturns + report.totals.returnedOrders) : null;
  return <aside className="flex items-center gap-4 rounded-card-lg border border-primary/20 bg-accent/45 px-4 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary"><Icon icon={Lightbulb} size="sm" /></span><p className="text-body-b7 text-foreground">{resolutionRate === null ? t("insightEmpty") : <><strong>{t("resolvedInsight", { percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(resolutionRate) })}</strong> {t("refundedInsight", { amount: formatMoney(report.totals.refundedAmount, locale) })}</>}</p></aside>;
}
