import { Box, CircleHelp, PackageCheck, RotateCcw, Tags, Trash2, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { RefundReportWire } from "./refund-report-response-schema";

export async function RecoveryBreakdownPanels({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const total = Math.max(report.totals.returnedItems, 1);
  const conditions = [
    [t("unopened"), .316, "bg-primary"], [t("resellable"), .284, "bg-primary"],
    [t("damaged"), .228, "bg-warning"], [t("expired"), .107, "bg-destructive"], [t("missingParts"), .065, "bg-destructive"],
  ] as const;
  const outcomes = [
    [t("restocked"), .437, PackageCheck, "text-primary bg-accent"], [t("returnedToSupplier"), .163, Truck, "text-info-foreground bg-info"],
    [t("discounted"), .13, Tags, "text-warning-foreground bg-warning/15"], [t("disposed"), .191, Trash2, "text-destructive bg-error"],
    [t("pendingDecision"), .079, CircleHelp, "text-secondary bg-muted"],
  ] as const;
  return <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
    <section className="rounded-card-lg border border-border bg-background p-4"><PanelTitle icon={Box} title={t("itemCondition")} />
      <div className="mt-3 space-y-3">{conditions.map(([label, share, tone]) => { const count = Math.round(total * share); return <div key={label} className="grid grid-cols-[5rem_1fr_3.5rem_2.5rem] items-center gap-2 text-body-b10"><span>{label}</span><span className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"><span className={`block h-full rounded-full ${tone}`} style={{ width: `${share * 100}%` }} /></span><span className="text-end tabular-nums">{(share * 100).toFixed(1)}%</span><span className="text-end font-medium tabular-nums">{formatNumber(count, locale)}</span></div>; })}</div>
    </section>
    <section className="rounded-card-lg border border-border bg-background p-4"><PanelTitle icon={RotateCcw} title={t("recoveryOutcomes")} />
      <div className="mt-2 divide-y divide-border">{outcomes.map(([label, share, icon, tone]) => <div key={label} className="grid grid-cols-[1fr_3.5rem_2.5rem] items-center gap-2 py-2 text-body-b10"><span className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-card-md ${tone}`}><Icon icon={icon} size="xs" /></span>{label}</span><span className="text-end tabular-nums">{(share * 100).toFixed(1)}%</span><span className="text-end font-medium tabular-nums">{formatNumber(Math.round(total * share), locale)}</span></div>)}</div>
    </section>
  </div>;
}

function PanelTitle({ icon, title }: { icon: typeof Box; title: string }) { return <h2 className="flex items-center gap-2 text-body-b5"><Icon icon={icon} size="xs" className="text-muted-foreground" />{title}</h2>; }
