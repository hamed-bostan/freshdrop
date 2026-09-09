import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentAttention({ segments, locale }: { segments: CustomerSegmentsWire["segments"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); const ids = ["at_risk", "dormant", "new_customers"] as const; const badgeTones = { at_risk: "bg-error text-destructive", dormant: "bg-warning/15 text-warning-foreground", new_customers: "bg-accent text-primary" };
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4 md:p-6"><h2 className="text-heading-h3">{t("needsAttention")}</h2><div className="mt-4 divide-y divide-border">{ids.map((id) => { const segment = segments.find((item) => item.id === id); if (!segment) return null; return <Link key={id} href={`/dashboard/customers?segment=${id}`} className={cn(focusRing, "grid grid-cols-1 gap-2 rounded-card-md py-3 hover:bg-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6")}><span className="min-w-0"><span className="block text-body-b10 font-semibold">{t(`segment.${id}`)}</span><span className="block text-body-b10 text-muted-foreground">{t("attentionDetail", { customers: formatNumber(segment.customers, locale), revenue: formatMoney(segment.revenue, locale) })}</span></span><span className={`inline-flex h-7 w-fit items-center gap-1.5 rounded-pill px-3 text-label-l1 font-semibold whitespace-nowrap before:size-1.5 before:shrink-0 before:rounded-full before:bg-current ${badgeTones[id]}`}>{t(`attention.${id}`)}</span></Link>; })}</div><Link href="/dashboard/customers" className={cn(focusRing, "mt-6 flex items-center justify-end gap-2 border-t border-border pt-4 text-body-b8 font-medium text-primary")}>{t("reviewHealth")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}
