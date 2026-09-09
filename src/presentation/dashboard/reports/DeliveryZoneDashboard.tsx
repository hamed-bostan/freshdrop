import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, TimerOff, TrendingUp, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { percentChange } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { StatCardCarousel } from "@/src/presentation/dashboard/StatCardCarousel";
import { Icon } from "@/src/presentation/design-system";

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
  const cards = metrics.map((metric) => <SalesMetricCard key={metric.label} {...metric} locale={locale} comparisonLabel={t("vsPrevious")} currentLabel={t("currentPeriod")} className="min-h-[174px] md:min-h-52 xl:min-h-48" />);
  return <><div className="sm:hidden"><StatCardCarousel>{cards}</StatCardCarousel></div><section className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">{cards}</section></>;
}

export async function DeliveryZoneMap({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const labels = { title: t("zoneCoverageDemand"), map: t("map"), list: t("list"), demand: t("demand"), onTime: t("onTimeShort"), orders: t("orders"), lowDemand: t("lowDemand"), highDemand: t("highDemand"), onTimeLegend: t("zoneMapLegend"), mapAria: t("zoneMapAria") };
  return <DeliveryZoneCoverageCard zones={report.zones} locale={locale} labels={labels} />;
}

export async function DeliveryZonePerformance({ report, locale }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4 md:p-6">
    <h2 className="text-heading-h3">{t("zonePerformance")}</h2>
    <div className="mt-4 border-t border-border pt-4">{report.zones.map((zone) => <div key={zone.zone} className="mb-4 last:mb-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-body-b10 md:text-body-b6 xl:text-body-b10"><span className="truncate font-semibold">{zone.zone}</span><span>{formatNumber(zone.orders, locale)} {t("orders").toLocaleLowerCase(locale)}</span><span className="text-end">{formatPercent(zone.onTimeRate, locale)}</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-muted"><div className="h-full min-w-1 rounded-pill bg-primary" style={{ width: `${Math.max(zone.onTimeRate * 100, 1)}%` }} /></div>
    </div>)}</div>
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
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4 md:p-6">
    <h2 className="text-heading-h3">{t("zoneAlerts")}</h2>
    {rows.length ? <div className="mt-4 divide-y divide-border rounded-card-md border border-border">{rows.map(({ key, title, detail, badge, icon, tone }) => <div key={key} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 p-3 text-body-b10 md:grid-cols-[2.5rem_minmax(0,1fr)_auto]"><span className={`flex size-10 items-center justify-center rounded-card-md ${tone}`}><Icon icon={icon} size="xs" /></span><span className="min-w-0"><span className="block font-semibold">{title}</span><span className="mt-0.5 block text-muted-foreground">{detail}</span></span><span className={`col-start-2 inline-flex h-7 w-fit items-center gap-1.5 justify-self-start rounded-pill px-3 text-label-l1 font-semibold whitespace-nowrap before:size-1.5 before:shrink-0 before:rounded-full before:bg-current md:col-start-3 md:row-start-1 md:justify-self-end ${tone}`}>{badge}</span></div>)}</div> : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noAlerts")}</p>}
    <Footer href="/dashboard/delivery-slots" label={t("viewAllAlerts")} />
  </section>;
}

function Footer({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-body-b8 font-medium text-primary">{label}<Icon icon={ExternalLink} size="xs" /></Link>; }
