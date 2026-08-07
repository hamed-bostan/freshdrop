import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { RefundReasonCount } from "@/src/domain/entities/RefundReport";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

const TONES = ["bg-primary", "bg-primary", "bg-warning-foreground", "bg-destructive", "bg-secondary"];

export async function ReturnReasonsPanel({ reasons, total, locale }: { reasons: RefundReasonCount[]; total: number; locale: Locale }) {
  const t = await getTranslations("dashRefundReport");
  const peak = Math.max(...reasons.map((reason) => reason.refunds), 1);
  return <section className="rounded-card-lg border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-1.5 text-body-b5">{t("reasons")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><span className="text-body-b10 text-muted-foreground">{t("refundShare")}</span></div>{reasons.length ? <div className="mt-5 space-y-4">{reasons.map((reason, index) => <div key={`${reason.kind}-${reason.reason}`} className="grid grid-cols-[minmax(5rem,1fr)_minmax(3.5rem,1.5fr)_3rem] items-center gap-3 text-body-b10"><span className="truncate text-foreground">{reason.reason}</span><span className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken"><span className={`block h-full rounded-pill ${TONES[index % TONES.length]}`} style={{ width: `${Math.max(reason.refunds / peak * 100, 4)}%` }} /></span><span className="text-end font-semibold" title={`${formatNumber(reason.refunds, locale)} · ${formatMoney(reason.amount, locale)}`}>{formatPercent(reason.refunds / Math.max(total, 1), locale)}</span></div>)}</div> : <p className="py-16 text-center text-body-b8 text-muted-foreground">{t("noReasons")}</p>}</section>;
}
