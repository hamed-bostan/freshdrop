import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { DeliveryWindowPerformance } from "@/src/domain/entities/DeliveryPerformanceReport";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

export async function DeliveryDemandByWindow({ windows, locale }: { windows: DeliveryWindowPerformance[]; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  const peak = Math.max(...windows.map((window) => window.orders), 1);
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("demandByWindow")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="mt-2 flex gap-5 text-label-l1"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-primary" />{t("orderDemand")}</span><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-info-foreground" />{t("onTimeRate")}</span></div>{windows.length ? <div className="mt-4 space-y-4">{windows.map((window) => <div key={window.id} className="grid grid-cols-[minmax(6rem,1fr)_minmax(10rem,4fr)] items-center gap-3"><span className="truncate text-body-b10 font-medium">{window.label}</span><div className="space-y-1"><div className="flex items-center gap-2"><span className="h-1.5 rounded-pill bg-primary" style={{ width: `${Math.max(window.orders / peak * 86, 3)}%` }} /><span className="text-label-l2">{formatNumber(window.orders, locale)}</span></div><div className="flex items-center gap-2"><span className="h-1.5 rounded-pill bg-info-foreground/40" style={{ width: `${Math.max(window.onTimeRate * 86, 3)}%` }} /><span className="text-label-l2">{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(window.onTimeRate)}</span></div></div></div>)}</div> : <p className="py-12 text-center text-body-b8 text-muted-foreground">{t("noData")}</p>}</section>;
}
