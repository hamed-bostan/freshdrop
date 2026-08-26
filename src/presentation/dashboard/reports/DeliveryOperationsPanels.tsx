import { ExternalLink, Info, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { Avatar, DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";

import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Panel = "zones" | "drivers";

/** The report's read-only aggregate panels — zone and driver rollups. Issues & incidents is `DeliveryIssuesPanel`, which reads real logged incidents rather than an aggregate. */
export async function DeliveryOperationsPanels({ report, zoneReport, locale, panel }: { report: DeliveryPerformanceWire; zoneReport?: DeliveryZonesWire; locale: Locale; panel: Panel }) {
  const t = await getTranslations("dashDeliveryReport");
  if (panel === "zones") return <section className="flex min-h-48 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4 md:min-h-60 md:p-6 xl:min-h-0 xl:p-4"><Heading title={t("zonesPerformance")} />
    <div className="mt-4 border-t border-border pt-4">{(zoneReport?.zones ?? []).map((zone) => <div key={zone.zone} className="mb-4 last:mb-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-body-b10 md:text-body-b6"><span className="truncate font-semibold">{zone.zone}</span><span>{formatNumber(zone.orders, locale)} {t("orders").toLocaleLowerCase(locale)}</span><span className="text-end">{formatPercent(zone.onTimeRate, locale)} {t("onTimeShort").toLocaleLowerCase(locale)}</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-muted"><div className="h-full min-w-1 rounded-pill bg-primary" style={{ width: `${Math.max(zone.onTimeRate * 100, 1)}%` }} /></div>
    </div>)}</div><FooterLink href="/dashboard/delivery-slots" label={t("viewDeliveryZones")} /></section>;
  return <section className="flex min-h-64 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4 md:min-h-80 md:p-6 xl:min-h-0 xl:p-4"><Heading title={t("driverPerformance")} />
    {report.drivers.length
      ? <DataTable className="mt-2 rounded-none border-x-0 border-b-0"><Table className="text-body-b10 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2"><TableHeader><tr><TableHead>#</TableHead><TableHead>{t("driverTeam")}</TableHead><TableHead className="text-end">{t("completedDeliveries")}</TableHead><TableHead className="text-end">{t("onTimeShort")}</TableHead><TableHead className="text-end">{t("averageRating")}</TableHead></tr></TableHeader><TableBody>{report.drivers.map((driver, index) => <TableRow key={driver.driverId}><TableCell className="text-muted-foreground">{index + 1}</TableCell><TableCell><span className="flex items-center gap-2 whitespace-nowrap font-medium"><Avatar name={driver.name} className="size-7 shrink-0 text-body-b10" />{driver.name}</span></TableCell><TableCell className="text-end">{formatNumber(driver.completedDeliveries, locale)}</TableCell><TableCell className="text-end">{formatPercent(driver.onTimeRate, locale)}</TableCell><TableCell className="text-end"><span className="inline-flex items-center justify-end gap-1 whitespace-nowrap"><Icon icon={Star} size="xs" className="fill-rating text-rating" />{driver.averageRating == null ? t("notAvailable") : driver.averageRating.toFixed(1)}</span></TableCell></TableRow>)}</TableBody></Table></DataTable>
      : <p className="py-10 text-center text-body-b8 text-muted-foreground">{t("noData")}</p>}
    <FooterLink href="/dashboard/team" label={t("viewAllDrivers")} /></section>;
}

function Heading({ title }: { title: string }) { return <h2 className="flex items-center gap-1.5 text-body-b5 md:text-heading-h3 xl:text-body-b5">{title}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>; }
function FooterLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-body-b8 font-medium text-primary">{label}<Icon icon={ExternalLink} size="xs" /></Link>; }
