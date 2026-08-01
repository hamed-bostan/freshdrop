import { ArrowDown, ArrowUp, Crown, Repeat2, RotateCcw, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import type { CustomerSegmentId } from "@/src/domain/entities/CustomerSegmentsReport";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

const DISPLAYED: { id: CustomerSegmentId; icon: LucideIcon; tone: string }[] = [
  { id: "new_customers", icon: Sparkles, tone: "bg-info text-info-foreground" }, { id: "repeat_buyers", icon: Repeat2, tone: "bg-info text-info-foreground" },
  { id: "high_value_loyal", icon: Crown, tone: "bg-muted text-secondary" }, { id: "reactivated", icon: RotateCcw, tone: "bg-warning text-warning-foreground" },
];

export async function CustomerSegmentTrends({ segments, locale }: { segments: CustomerSegmentsWire["segments"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments");
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("segmentTrends")}</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{DISPLAYED.map(({ id, icon, tone }) => { const segment = segments.find((item) => item.id === id); const current = segment?.customers ?? 0; const previous = segment?.previousCustomers ?? 0; const change = previous ? (current - previous) / previous : null; return <article key={id} className="rounded-card-lg border border-border p-3"><div className="flex items-center gap-3"><span className={`flex size-9 items-center justify-center rounded-full ${tone}`}><Icon icon={icon} size="xs" /></span><div className="min-w-0"><p className="truncate text-body-b10 text-muted-foreground">{t(`segment.${id}`)}</p><p className="text-heading-h3">{formatNumber(current, locale)}</p></div></div><p className="mt-2 flex items-center gap-1 text-body-b10">{change === null ? <span className="text-muted-foreground">{t("currentPeriod")}</span> : <><Icon icon={change >= 0 ? ArrowUp : ArrowDown} size="xs" className={change >= 0 ? "text-success-foreground" : "text-destructive"} /><span className={change >= 0 ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{new Intl.NumberFormat(locale, { style: "percent", signDisplay: "always", maximumFractionDigits: 1 }).format(change)}</span></>}</p></article>; })}</div><p className="mt-4 text-body-b10 text-muted-foreground">{t("trendNote")}</p></section>;
}
