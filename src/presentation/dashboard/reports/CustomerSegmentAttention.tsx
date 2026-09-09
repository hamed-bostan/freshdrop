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
  const t = await getTranslations("dashCustomerSegments"); const ids = ["at_risk", "dormant", "new_customers"] as const; const badgeTones = { at_risk: "bg-surface-sunken text-foreground", dormant: "bg-surface-sunken text-foreground", new_customers: "bg-error text-primary" };
  return <section className="flex min-h-[300px] flex-col rounded-card-lg border border-border bg-background p-4 md:min-h-[340px] md:p-6"><h2 className="text-heading-h3">{t("needsAttention")}</h2><div className="mt-4 divide-y divide-border">{ids.map((id) => { const segment = segments.find((item) => item.id === id); if (!segment) return null; return <Link key={id} href={`/dashboard/customers?segment=${id}`} className={cn(focusRing, "flex items-center gap-3 rounded-card-md py-3 hover:bg-muted")}><span className="min-w-0 flex-1"><span className="block text-body-b10 font-semibold">{t(`segment.${id}`)}</span><span className="block truncate text-body-b10 text-muted-foreground">{t("attentionDetail", { customers: formatNumber(segment.customers, locale), revenue: formatMoney(segment.revenue, locale) })}</span></span><span className={`max-w-36 rounded-pill px-3 py-1 text-center text-label-l1 font-semibold ${badgeTones[id]}`}>{t(`attention.${id}`)}</span></Link>; })}</div><Link href="/dashboard/customers" className={cn(focusRing, "mt-auto flex items-center justify-end gap-2 border-t border-border pt-3 text-body-b8 text-primary")}>{t("reviewHealth")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}
