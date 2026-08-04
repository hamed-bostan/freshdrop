import { Box, CircleHelp, PackageCheck, RotateCcw, Tags, Trash2, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReturnItemCondition, ReturnRecoveryDecision } from "@/src/domain/entities/Return";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { RefundReportWire } from "./refund-report-response-schema";

const CONDITION_TONE: Record<ReturnItemCondition | "not_recorded", string> = {
  unopened: "bg-primary", resellable: "bg-primary", damaged: "bg-warning", expired: "bg-destructive", missing_parts: "bg-destructive", not_recorded: "bg-muted-foreground",
};
const OUTCOME_TONE: Record<ReturnRecoveryDecision | "not_recorded", { icon: typeof Box; tone: string }> = {
  restocked: { icon: PackageCheck, tone: "text-primary bg-accent" },
  returned_to_supplier: { icon: Truck, tone: "text-info-foreground bg-info" },
  discounted: { icon: Tags, tone: "text-warning-foreground bg-warning/15" },
  disposed: { icon: Trash2, tone: "text-destructive bg-error" },
  pending: { icon: CircleHelp, tone: "text-secondary bg-muted" },
  not_recorded: { icon: CircleHelp, tone: "text-muted-foreground bg-surface-sunken" },
};

export async function RecoveryBreakdownPanels({ report, locale }: { report: RefundReportWire; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const { conditions, outcomes } = report.returnBreakdown;
  const conditionTotal = Math.max(conditions.reduce((sum, row) => sum + row.count, 0), 1);
  const outcomeTotal = Math.max(outcomes.reduce((sum, row) => sum + row.count, 0), 1);
  const conditionLabel: Record<ReturnItemCondition | "not_recorded", string> = {
    unopened: t("unopened"), resellable: t("resellable"), damaged: t("damaged"), expired: t("expired"), missing_parts: t("missingParts"), not_recorded: t("notRecorded"),
  };
  const outcomeLabel: Record<ReturnRecoveryDecision | "not_recorded", string> = {
    restocked: t("restocked"), returned_to_supplier: t("returnedToSupplier"), discounted: t("discounted"), disposed: t("disposed"), pending: t("pendingDecision"), not_recorded: t("notRecorded"),
  };
  return <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
    <section className="rounded-card-lg border border-border bg-background p-4"><PanelTitle icon={Box} title={t("itemCondition")} />
      <div className="mt-3 space-y-3">{conditions.map((row) => { const key = row.condition ?? "not_recorded"; const share = row.count / conditionTotal; return <div key={key} className="grid grid-cols-[5rem_1fr_3.5rem_2.5rem] items-center gap-2 text-body-b10"><span>{conditionLabel[key]}</span><span className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"><span className={`block h-full rounded-full ${CONDITION_TONE[key]}`} style={{ width: `${share * 100}%` }} /></span><span className="text-end tabular-nums">{(share * 100).toFixed(1)}%</span><span className="text-end font-medium tabular-nums">{formatNumber(row.count, locale)}</span></div>; })}</div>
    </section>
    <section className="rounded-card-lg border border-border bg-background p-4"><PanelTitle icon={RotateCcw} title={t("recoveryOutcomes")} />
      <div className="mt-2 divide-y divide-border">{outcomes.map((row) => { const key = row.decision ?? "not_recorded"; const share = row.count / outcomeTotal; const { icon, tone } = OUTCOME_TONE[key]; return <div key={key} className="grid grid-cols-[1fr_3.5rem_2.5rem] items-center gap-2 py-2 text-body-b10"><span className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-card-md ${tone}`}><Icon icon={icon} size="xs" /></span>{outcomeLabel[key]}</span><span className="text-end tabular-nums">{(share * 100).toFixed(1)}%</span><span className="text-end font-medium tabular-nums">{formatNumber(row.count, locale)}</span></div>; })}</div>
    </section>
  </div>;
}

function PanelTitle({ icon, title }: { icon: typeof Box; title: string }) { return <h2 className="flex items-center gap-2 text-body-b5"><Icon icon={icon} size="xs" className="text-muted-foreground" />{title}</h2>; }
