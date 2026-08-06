import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

type Segment = CustomerSegmentsWire["segments"][number];

export async function CustomerMixPanel({ segments, locale }: { segments: CustomerSegmentsWire["segments"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerInsights");
  const customersOf = (...ids: Segment["id"][]) => segments.filter((segment) => ids.includes(segment.id)).reduce((sum, segment) => sum + segment.customers, 0);
  const total = segments.reduce((sum, segment) => sum + segment.customers, 0);
  const returning = customersOf("repeat_buyers", "high_value_loyal");
  const fresh = customersOf("new_customers");
  const reactivated = customersOf("reactivated");
  const atRisk = customersOf("at_risk", "dormant");
  const rows = [{ label: t("returning"), value: returning, color: "bg-primary" }, { label: t("newLabel"), value: fresh, color: "bg-info-foreground" }, { label: t("reactivated"), value: reactivated, color: "bg-secondary" }, { label: t("atRisk"), value: atRisk, color: "bg-warning-foreground" }];
  let cursor = 0; const stops = total ? rows.map((row) => { const start = cursor; cursor += row.value / total * 100; return `${color(row.color)} ${start}% ${cursor}%`; }).join(", ") : "var(--color-muted) 0 100%";
  return <section className="rounded-card-lg border border-border bg-background p-4"><h2 className="flex items-center gap-1.5 text-body-b5">{t("customerMix")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"><div className="relative flex size-40 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }} aria-hidden><div className="flex size-28 flex-col items-center justify-center rounded-full bg-background"><strong className="text-heading-h2">{formatNumber(total, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("active")}</span></div></div><dl className="w-full min-w-0 divide-y divide-border">{rows.map((row) => <div key={row.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 text-body-b10"><span className={`size-2 rounded-full ${row.color}`} /><dt>{row.label}</dt><dd>{formatPercent(total ? row.value / total : 0, locale)}</dd><dd className="w-14 text-end font-semibold">{formatNumber(row.value, locale)}</dd></div>)}</dl></div></section>;
}
function color(tone: string) { return tone === "bg-primary" ? "var(--color-primary)" : tone === "bg-info-foreground" ? "var(--color-info-foreground)" : tone === "bg-secondary" ? "var(--color-secondary)" : "var(--color-warning-foreground)"; }
