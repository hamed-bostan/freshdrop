import { AlertTriangle, CheckCircle2, ExternalLink, Info, TimerOff, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";

type Alert = { key: string; title: string; detail: string; badge: string; icon: LucideIcon; tone: string; badgeTone: string };

export async function DeliveryAlerts({ report, locale }: { report: DeliveryPerformanceWire; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  const weakest = [...report.windows].sort((a, b) => a.onTimeRate - b.onTimeRate)[0];
  const strongest = [...report.windows].sort((a, b) => b.onTimeRate - a.onTimeRate)[0];
  const alerts: Alert[] = [];
  if (report.totals.lateDeliveries > 0) alerts.push({ key: "late", title: t("lateAlert"), detail: t("lateAlertDetail", { count: report.totals.lateDeliveries }), badge: t("critical"), icon: TimerOff, tone: "bg-error text-destructive", badgeTone: "border-destructive/30 text-destructive" });
  if (weakest && weakest.onTimeRate < .92) alerts.push({ key: "sla", title: t("slaAlert", { window: weakest.label }), detail: t("slaAlertDetail", { rate: formatPercent(weakest.onTimeRate, locale) }), badge: t("warningBadge"), icon: AlertTriangle, tone: "bg-warning text-warning-foreground", badgeTone: "border-warning-foreground/30 text-warning-foreground" });
  if (report.totals.deliveredOrders > report.previousTotals.deliveredOrders) alerts.push({ key: "demand", title: t("demandIncreasing"), detail: t("demandDetail", { count: report.totals.deliveredOrders }), badge: t("monitor"), icon: TrendingUp, tone: "bg-info text-info-foreground", badgeTone: "border-info-foreground/30 text-info-foreground" });
  if (strongest) alerts.push({ key: "healthy", title: t("performingWell", { window: strongest.label }), detail: t("onTimeDetail", { rate: formatPercent(strongest.onTimeRate, locale) }), badge: t("healthy"), icon: CheckCircle2, tone: "bg-accent text-primary", badgeTone: "border-primary/30 text-primary" });
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("alerts")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>{alerts.length ? <div className="mt-3 divide-y divide-border rounded-card-md border border-border">{alerts.map((alert) => <div key={alert.key} className="grid grid-cols-[auto_minmax(8rem,1fr)_minmax(7rem,1fr)_auto] items-center gap-3 px-3 py-2"><span className={`flex size-8 items-center justify-center rounded-card-md ${alert.tone}`}><Icon icon={alert.icon} size="xs" /></span><span className="truncate text-body-b10 font-medium">{alert.title}</span><span className="truncate text-body-b10 text-muted-foreground">{alert.detail}</span><span className={`rounded-card-md border px-2 py-1 text-label-l1 ${alert.badgeTone}`}>{alert.badge}</span></div>)}</div> : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noAlerts")}</p>}<Link href="/dashboard/orders?delivery=late" className={cn(focusRing, "mt-auto flex items-center gap-1 pt-3 text-body-b8 text-primary hover:text-primary-hover")}>{t("viewLateOrders")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}

function formatPercent(value: number, locale: Locale): string { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
