import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CustomerSegments } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";

export async function CustomerMixPanel({ segments, locale }: { segments: CustomerSegments; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const total = segments.totalCustomers;
  const returningPercent = total ? segments.returningCustomers / total * 100 : 0;
  const stops = total ? `var(--color-primary) 0 ${returningPercent}%, var(--color-info-foreground) ${returningPercent}% 100%` : "var(--color-muted) 0 100%";
  const rows = [{ label: t("returningCustomers"), value: segments.returningCustomers, color: "bg-primary" }, { label: t("newCustomers"), value: segments.newCustomers, color: "bg-info-foreground" }];
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("customerMix")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"><div className="relative flex size-40 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }} aria-hidden><div className="flex size-28 flex-col items-center justify-center rounded-full bg-background"><strong className="text-heading-h2">{formatNumber(total, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("active")}</span></div></div><dl className="w-full min-w-0 divide-y divide-border">{rows.map((row) => <div key={row.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-3 text-body-b10"><span className={`size-2 rounded-full ${row.color}`} /><dt>{row.label}</dt><dd>{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(total ? row.value / total : 0)}</dd><dd className="w-14 text-end font-semibold">{formatNumber(row.value, locale)}</dd></div>)}<div className="flex items-center justify-between py-3 text-body-b10"><dt className="text-muted-foreground">{t("repeatCustomers")}</dt><dd className="font-semibold">{formatNumber(segments.repeatCustomers, locale)}</dd></div></dl></div></section>;
}
