import { AlertTriangle, CheckCircle2, ExternalLink, Info, MapPin, TimerOff, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { percentChange } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";
import { DeliveryZoneMapClient } from "./DeliveryZoneMapClient";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";
import { SalesMetricCard } from "./SalesMetricCard";

type Props = { report: DeliveryZonesWire; locale: Locale };

export async function DeliveryZoneMetrics({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const rate = report.totals.deliveredOrders ? report.totals.onTimeOrders / report.totals.deliveredOrders : 0;
  const previousRate = report.previousTotals.deliveredOrders ? report.previousTotals.onTimeOrders / report.previousTotals.deliveredOrders : 0;
  const metrics = [
    { label: t("activeZones"), value: formatNumber(report.totals.zonesServed, locale), icon: MapPin, tone: "green" as const, delta: null, values: [report.totals.zonesServed, report.totals.zonesServed] },
    { label: t("ordersDelivered"), value: formatNumber(report.totals.deliveredOrders, locale), icon: Truck, tone: "blue" as const, delta: percentChange(report.totals.deliveredOrders, report.previousTotals.deliveredOrders), values: [report.previousTotals.deliveredOrders, report.totals.deliveredOrders] },
    { label: t("onTimeRate"), value: formatPercent(rate, locale), icon: CheckCircle2, tone: "green" as const, delta: previousRate ? (rate - previousRate) / previousRate : null, values: [previousRate, rate] },
    { label: t("lateDeliveries"), value: formatNumber(report.totals.lateDeliveries, locale), icon: TimerOff, tone: "orange" as const, delta: percentChange(report.totals.lateDeliveries, report.previousTotals.lateDeliveries), values: [report.previousTotals.lateDeliveries, report.totals.lateDeliveries], inverse: true },
  ];
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} currentLabel={t("currentPeriod")} />)}</section>;
}

export async function DeliveryZoneMap({ report }: { report: DeliveryZonesWire }) {
  const t = await getTranslations("dashDeliveryReport");
  return <section className="rounded-card-lg border border-border bg-background p-3">
    <div className="flex items-center justify-between"><h2 className="text-body-b5">{t("zoneCoverageDemand")}</h2></div>
    <div className="relative mt-2 h-[245px] overflow-hidden rounded-card-md border border-border" aria-label={t("zoneMapAria")}>
      <DeliveryZoneMapClient zones={report.zones} ordersLabel={t("orders")} onTimeLabel={t("onTimeShort")} />
    </div>
    <p className="mt-2 text-label-l1 text-muted-foreground">{t("zoneMapLegend")}</p>
  </section>;
}

export async function DeliveryZonePerformance({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="text-body-b5">{t("zonePerformance")}</h2>
    <DataTable className="mt-2 rounded-none border-x-0 border-b-0"><Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2"><TableHeader><tr><TableHead>{t("zone")}</TableHead><TableHead className="text-end">{t("orders")}</TableHead><TableHead className="text-end">{t("onTimeShort")}</TableHead><TableHead className="text-end">{t("averageTimeShort")}</TableHead><TableHead className="text-end">{t("change")}</TableHead></tr></TableHeader><TableBody>{report.zones.map((zone) => {
      const change = zone.previousOnTimeRate == null ? null : (zone.onTimeRate - zone.previousOnTimeRate) * 100;
      return <TableRow key={zone.zone}><TableCell className="font-medium">{zone.zone}</TableCell><TableCell className="text-end">{formatNumber(zone.orders, locale)}</TableCell><TableCell className="text-end">{formatPercent(zone.onTimeRate, locale)}</TableCell><TableCell className="text-end">{t("compactMinutes", { value: zone.averageFulfillmentMinutes })}</TableCell><TableCell className={`whitespace-nowrap text-end font-semibold ${change == null ? "text-muted-foreground" : change >= 0 ? "text-primary" : "text-destructive"}`}>{change == null ? "—" : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}%`}</TableCell></TableRow>;
    })}</TableBody></Table></DataTable>
    <Footer href="/dashboard/delivery-slots" label={t("viewAllZones")} />
  </section>;
}

export async function DeliveryZoneDemand({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const max = Math.max(...report.zones.map((zone) => zone.orders), 1);
  return <section className="rounded-card-lg border border-border bg-background p-4">
    <h2 className="flex items-center gap-1.5 text-body-b5">{t("ordersByZone")}<Icon icon={Info} size="xs" /></h2>
    <div className="mt-3 space-y-3">{report.zones.map((zone) => <div key={zone.zone} className="grid grid-cols-[4rem_1fr] items-center gap-3 text-body-b10"><span className="truncate">{zone.zone}</span><Bar width={(zone.orders / max) * 96} label={formatNumber(zone.orders, locale)} /></div>)}</div>
  </section>;
}

export async function DeliveryZoneAlerts({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const strongest = report.zones.length ? [...report.zones].sort((a, b) => b.onTimeRate - a.onTimeRate)[0] : undefined;
  const rows = [
    ...report.alerts.map((alert) => ({
      key: `${alert.zone}-${alert.severity}`,
      title: t("zoneBelowTarget", { zone: alert.zone }),
      detail: t("zoneAlertDetail", { rate: formatPercent(alert.onTimeRate, locale), count: alert.lateDeliveries }),
      badge: alert.severity === "critical" ? t("critical") : t("warningBadge"),
      icon: AlertTriangle,
      tone: alert.severity === "critical" ? "text-destructive bg-error" : "text-warning-foreground bg-warning/15",
    })),
    ...(strongest && strongest.onTimeRate >= 0.95
      ? [{ key: `${strongest.zone}-healthy`, title: t("zonePerformingWell", { zone: strongest.zone }), detail: t("onTimeDetail", { rate: formatPercent(strongest.onTimeRate, locale) }), badge: t("healthy"), icon: CheckCircle2, tone: "text-primary bg-accent" }]
      : []),
  ];
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="text-body-b5">{t("zoneAlerts")}</h2>
    {rows.length ? <div className="mt-2 divide-y divide-border rounded-card-md border border-border">{rows.map(({ key, title, detail, badge, icon, tone }) => <div key={key} className="grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-3 px-3 py-2 text-body-b10"><span className={`flex size-8 items-center justify-center rounded-card-md ${tone}`}><Icon icon={icon} size="xs" /></span><span className="font-medium">{title}</span><span className="text-muted-foreground">{detail}</span><span className={`rounded-card-md border px-2 py-1 text-label-l1 ${tone}`}>{badge}</span></div>)}</div> : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noAlerts")}</p>}
    <Footer href="/dashboard/delivery-slots" label={t("viewAllAlerts")} />
  </section>;
}

function Footer({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-body-b8 font-medium text-primary">{label}<Icon icon={ExternalLink} size="xs" /></Link>; }
function Bar({ width, label }: { width: number; label: string }) { return <div className="flex items-center gap-2"><span className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(width, 4)}%` }} /><span className="text-label-l1">{label}</span></div>; }
function formatPercent(value: number, locale: Locale) { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
