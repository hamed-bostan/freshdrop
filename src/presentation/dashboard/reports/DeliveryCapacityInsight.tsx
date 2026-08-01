import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";

export async function DeliveryCapacityInsight({ report, locale }: { report: DeliveryPerformanceWire; locale: Locale }) {
  const t = await getTranslations("dashDeliveryReport");
  const weakest = [...report.windows].sort((a, b) => a.onTimeRate - b.onTimeRate)[0];
  return <aside className="flex flex-col gap-3 rounded-card-lg border border-warning-foreground/30 bg-warning/30 px-4 py-3 sm:flex-row sm:items-center"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-warning-foreground/30 bg-background text-warning-foreground"><Icon icon={AlertTriangle} size="sm" /></span><p className="flex-1 text-body-b7">{weakest ? t("windowInsight", { window: weakest.label, rate: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(weakest.onTimeRate) }) : t("insightEmpty")}</p><Link href="/dashboard/delivery-slots" className={cn(focusRing, "inline-flex h-8 items-center justify-center rounded-input border border-warning-foreground/50 bg-background px-4 text-body-b10 font-semibold text-warning-foreground hover:bg-warning")}>{t("reviewCapacity")}</Link></aside>;
}
