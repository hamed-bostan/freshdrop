import { ExternalLink, Info, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { Avatar, DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Panel = "zones" | "issues" | "drivers";

export async function DeliveryOperationsPanels({ report, zoneReport, customers, locale, panel }: { report: DeliveryPerformanceWire; zoneReport?: DeliveryZonesWire; customers: CustomerOrderSummary[]; locale: Locale; panel: Panel }) {
  const t = await getTranslations("dashDeliveryReport");
  if (panel === "zones") return <section className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><Heading title={t("zonesPerformance")} />
    <DataTable className="mt-2 rounded-none border-x-0 border-b-0"><Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2"><TableHeader><tr><TableHead>{t("zone")}</TableHead><TableHead className="text-end">{t("orders")}</TableHead><TableHead className="text-end">{t("onTimeShort")}</TableHead><TableHead className="text-end">{t("averageDuration")}</TableHead><TableHead className="text-end">{t("change")}</TableHead></tr></TableHeader><TableBody>{(zoneReport?.zones ?? []).map((zone) => {
      const change = zone.previousOnTimeRate == null ? null : (zone.onTimeRate - zone.previousOnTimeRate) * 100;
      return <TableRow key={zone.zone}><TableCell className="font-medium">{zone.zone}</TableCell><TableCell className="text-end">{formatNumber(zone.orders, locale)}</TableCell><TableCell className="text-end">{formatPercent(zone.onTimeRate, locale)}</TableCell><TableCell className="text-end">{t("compactMinutes", { value: zone.averageFulfillmentMinutes })}</TableCell><TableCell className={`whitespace-nowrap text-end font-semibold ${change == null ? "text-muted-foreground" : change >= 0 ? "text-primary" : "text-destructive"}`}>{change == null ? "—" : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}%`}</TableCell></TableRow>;
    })}</TableBody></Table></DataTable><FooterLink href="/dashboard/delivery-slots" label={t("viewDeliveryZones")} /></section>;
  if (panel === "drivers") return <section className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><Heading title={t("driverPerformance")} />
    {report.drivers.length
      ? <DataTable className="mt-2 rounded-none border-x-0 border-b-0"><Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2"><TableHeader><tr><TableHead>#</TableHead><TableHead>{t("driverTeam")}</TableHead><TableHead className="text-end">{t("completedDeliveries")}</TableHead><TableHead className="text-end">{t("onTimeShort")}</TableHead><TableHead className="text-end">{t("averageRating")}</TableHead></tr></TableHeader><TableBody>{report.drivers.map((driver, index) => <TableRow key={driver.driverId}><TableCell className="text-muted-foreground">{index + 1}</TableCell><TableCell><span className="flex items-center gap-2 whitespace-nowrap font-medium"><Avatar name={driver.name} className="size-7 shrink-0 text-body-b10" />{driver.name}</span></TableCell><TableCell className="text-end">{formatNumber(driver.completedDeliveries, locale)}</TableCell><TableCell className="text-end">{formatPercent(driver.onTimeRate, locale)}</TableCell><TableCell className="text-end"><span className="inline-flex items-center justify-end gap-1 whitespace-nowrap"><Icon icon={Star} size="xs" className="fill-rating text-rating" />{driver.averageRating == null ? t("notAvailable") : driver.averageRating.toFixed(1)}</span></TableCell></TableRow>)}</TableBody></Table></DataTable>
      : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noData")}</p>}
    <FooterLink href="/dashboard/team" label={t("viewAllDrivers")} /></section>;
  const customerById = new Map(customers.map((customer) => [customer.userId, customer.name]));
  return <section className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><Heading title={t("issuesIncidents")} />
    {report.lateDeliveries.length
      ? <DataTable className="mt-2 rounded-none border-x-0 border-b-0"><Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2"><TableHeader><tr><TableHead>{t("order")}</TableHead><TableHead>{t("zone")}</TableHead><TableHead>{t("customer")}</TableHead><TableHead>{t("delay")}</TableHead><TableHead>{t("date")}</TableHead></tr></TableHeader><TableBody>{report.lateDeliveries.map((row) => <TableRow key={row.orderId}><TableCell><Link href={`/dashboard/orders/${row.orderId}`} className="whitespace-nowrap font-mono font-semibold text-primary">#{row.orderNumber}</Link></TableCell><TableCell className="whitespace-nowrap">{row.zone}</TableCell><TableCell className="whitespace-nowrap">{customerById.get(row.userId) ?? t("notAvailable")}</TableCell><TableCell>{t("compactMinutes", { value: row.delayMinutes })}</TableCell><TableCell className="text-muted-foreground"><span className="block whitespace-nowrap">{formatOrderDateShort(row.deliveredAt, locale)}</span><span className="mt-0.5 block whitespace-nowrap text-body-b10">{formatOrderTime(row.deliveredAt, locale)}</span></TableCell></TableRow>)}</TableBody></Table></DataTable>
      : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noLateOrders")}</p>}
    <FooterLink href="/dashboard/orders?delivery=late" label={t("viewAllIssues")} /></section>;
}

function Heading({ title }: { title: string }) { return <h2 className="flex items-center gap-1.5 text-body-b5">{title}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>; }
function FooterLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-body-b8 font-medium text-primary">{label}<Icon icon={ExternalLink} size="xs" /></Link>; }
function formatPercent(value: number, locale: Locale) { return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value); }
