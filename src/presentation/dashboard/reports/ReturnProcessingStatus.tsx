import { Ban, CheckCircle2, Info, PackageOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { RefundReportTotals } from "@/src/domain/entities/RefundReport";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

export async function ReturnProcessingStatus({ totals, locale }: { totals: RefundReportTotals; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const rows = [
    { label: t("requested"), value: totals.requestedReturns, icon: PackageOpen, tone: "bg-info text-info-foreground" },
    { label: t("refunded"), value: totals.returnedOrders, icon: CheckCircle2, tone: "bg-accent text-primary" },
    { label: t("cancelled"), value: totals.cancelledOrders, icon: Ban, tone: "bg-error text-destructive" },
  ];
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("processingStatus")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><dl className="mt-3 divide-y divide-border">{rows.map((row) => <div key={row.label} className="flex items-center gap-3 py-4"><span className={`flex size-8 items-center justify-center rounded-card-md ${row.tone}`}><Icon icon={row.icon} size="xs" /></span><dt className="flex-1 text-body-b7">{row.label}</dt><dd className="text-body-b8">{formatNumber(row.value, locale)}</dd></div>)}</dl></section>;
}
