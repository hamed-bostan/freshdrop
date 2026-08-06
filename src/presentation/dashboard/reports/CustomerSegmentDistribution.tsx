import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

const COLORS = ["var(--color-primary)", "var(--color-muted-foreground)", "var(--color-info-foreground)", "var(--color-secondary)", "var(--color-warning-foreground)", "var(--color-destructive)"];
const DOTS = ["bg-primary", "bg-muted-foreground", "bg-info-foreground", "bg-secondary", "bg-warning-foreground", "bg-destructive"];

export async function CustomerSegmentDistribution({ segments, total, locale }: { segments: CustomerSegmentsWire["segments"]; total: number; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); let cursor = 0; const stops = total ? segments.map((segment, index) => { const start = cursor; cursor += segment.customers / total * 100; return `${COLORS[index]} ${start}% ${cursor}%`; }).join(", ") : "var(--color-muted) 0 100%";
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("distribution")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"><div className="flex size-40 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }} aria-hidden><div className="flex size-28 flex-col items-center justify-center rounded-full bg-background"><strong className="text-heading-h2">{formatNumber(total, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("customers")}</span></div></div><dl className="w-full divide-y divide-border">{segments.map((segment, index) => <div key={segment.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 text-body-b10"><span className={`size-2 rounded-full ${DOTS[index]}`} /><dt className="truncate">{t(`segment.${segment.id}`)}</dt><dd className="font-semibold">{formatPercent(total ? segment.customers / total : 0, locale)}</dd></div>)}</dl></div></section>;
}
