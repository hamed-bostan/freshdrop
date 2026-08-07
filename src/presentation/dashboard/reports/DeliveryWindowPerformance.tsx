import { ExternalLink, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DeliveryWindowPerformance as DeliveryWindow } from "@/src/domain/entities/DeliveryPerformanceReport";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, focusRing } from "@/src/presentation/design-system";

export async function DeliveryWindowPerformance({ windows, locale }: { windows: DeliveryWindow[]; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  return <section className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("windowPerformance")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>{windows.length ? <DataTable className="mt-3"><Table><TableHeader><tr><TableHead>{t("window")}</TableHead><TableHead className="text-end">{t("orders")}</TableHead><TableHead className="text-end">{t("onTimeShort")}</TableHead><TableHead className="text-end">{t("averageTimeShort")}</TableHead><TableHead>{t("serviceLevel")}</TableHead></tr></TableHeader><TableBody>{windows.map((window) => { const percent = window.onTimeRate * 100; const tone = percent >= 92 ? "bg-primary" : percent >= 85 ? "bg-warning-foreground" : "bg-destructive"; return <TableRow key={window.id}><TableCell className="font-medium">{window.label}</TableCell><TableCell className="text-end">{formatNumber(window.orders, locale)}</TableCell><TableCell className="text-end">{formatPercent(window.onTimeRate, locale)}</TableCell><TableCell className="text-end">{t("minutesValue", { value: formatNumber(window.averageFulfillmentMinutes, locale) })}</TableCell><TableCell><div className="flex min-w-24 items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-sunken"><span className={`block h-full rounded-pill ${tone}`} style={{ width: `${Math.max(percent, 3)}%` }} /></span></div></TableCell></TableRow>; })}</TableBody></Table></DataTable> : <p className="py-16 text-center text-body-b8 text-muted-foreground">{t("noData")}</p>}<Link href="/dashboard/delivery-slots" className={cn(focusRing, "mt-auto flex items-center gap-1 border-t border-border pt-3 text-body-b8 text-primary hover:text-primary-hover")}>{t("viewAllWindows")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}
