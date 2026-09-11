import { getTranslations } from "next-intl/server";

import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

const COLORS = ["var(--color-border)", "var(--color-border)", "var(--color-primary)", "var(--color-border)", "var(--color-border)", "var(--color-foreground)"];
const DOTS = ["bg-border", "bg-border", "bg-primary", "bg-border", "bg-border", "bg-foreground"];

export async function CustomerSegmentDistribution({ segments, total, locale }: { segments: CustomerSegmentsWire["segments"]; total: number; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); let cursor = 0; const stops = total ? segments.map((segment, index) => { const start = cursor; cursor += segment.customers / total * 100; return `${COLORS[index]} ${start}% ${cursor}%`; }).join(", ") : "var(--color-muted) 0 100%";
  return <section className="min-h-[360px] rounded-card-lg border border-border bg-background p-4 md:min-h-80 md:p-6 xl:min-h-[400px]"><h2 className="text-heading-h3">{t("distribution")}</h2><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center xl:gap-8"><div className="flex size-40 shrink-0 items-center justify-center rounded-full md:size-44 xl:size-52" style={{ background: `conic-gradient(${stops})` }} aria-hidden><div className="flex size-28 flex-col items-center justify-center rounded-full bg-background md:size-32 xl:size-36"><strong className="text-heading-h2">{formatNumber(total, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("customers")}</span></div></div><dl className="w-full min-w-0 divide-y divide-border">{segments.map((segment, index) => <div key={segment.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_2rem] items-center gap-3 py-2.5 text-body-b10"><span className={`size-2 rounded-full ${DOTS[index]}`} /><dt className="truncate">{t(`segment.${segment.id}`)}</dt><dd>{formatPercent(total ? segment.customers / total : 0, locale)}</dd><dd className="text-end font-semibold">{formatNumber(segment.customers, locale)}</dd></div>)}</dl></div></section>;
}
