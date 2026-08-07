import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, TimerOff, TrendingUp, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { percentChange } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";

import { DeliveryZoneCoverageCard } from "./DeliveryZoneCoverageCard";
import { SalesMetricCard } from "./SalesMetricCard";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

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

export async function DeliveryZoneMap({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const labels = { title: t("zoneCoverageDemand"), map: t("map"), list: t("list"), demand: t("demand"), onTime: t("onTimeShort"), orders: t("orders"), lowDemand: t("lowDemand"), highDemand: t("highDemand"), onTimeLegend: t("zoneMapLegend"), mapAria: t("zoneMapAria") };
  return <DeliveryZoneCoverageCard zones={report.zones} locale={locale} labels={labels} />;
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
    ...(report.demandAlert
      ? [{ key: `${report.demandAlert.zone}-demand`, title: t("demandIncreasing", { zone: report.demandAlert.zone }), detail: t("demandDetail", { percent: Math.round(report.demandAlert.growthRate * 100) }), badge: t("monitor"), icon: TrendingUp, tone: "text-info-foreground bg-info" }]
      : []),
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
