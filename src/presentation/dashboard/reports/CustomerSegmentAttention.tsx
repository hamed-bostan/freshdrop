import { AlertTriangle, ChevronRight, ExternalLink, Moon, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentAttention({ segments, locale }: { segments: CustomerSegmentsWire["segments"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments"); const ids = ["at_risk", "dormant", "new_customers"] as const; const icons = { at_risk: AlertTriangle, dormant: Moon, new_customers: Sparkles }; const tones = { at_risk: "bg-error text-destructive", dormant: "bg-surface-sunken text-muted-foreground", new_customers: "bg-info text-info-foreground" };
  return <section className="flex flex-col rounded-card-lg border border-border bg-background p-4"><h2 className="text-body-b5">{t("needsAttention")}</h2><div className="mt-3 divide-y divide-border">{ids.map((id) => { const segment = segments.find((item) => item.id === id); if (!segment) return null; return <Link key={id} href={`/dashboard/customers?segment=${id}`} className={cn(focusRing, "flex items-center gap-3 rounded-card-md py-2 hover:bg-muted")}><span className={`flex size-9 items-center justify-center rounded-card-md ${tones[id]}`}><Icon icon={icons[id]} size="sm" /></span><span className="min-w-0 flex-1"><span className="block text-body-b10 font-semibold">{t(`segment.${id}`)}</span><span className="block truncate text-body-b10 text-muted-foreground">{t("attentionDetail", { customers: formatNumber(segment.customers, locale), revenue: formatMoney(segment.revenue, locale) })}</span></span><span className="rounded-card-md bg-warning px-2 py-1 text-label-l1 text-warning-foreground">{t(`attention.${id}`)}</span><Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:rotate-180" /></Link>; })}</div><Link href="/dashboard/customers" className={cn(focusRing, "mt-auto flex items-center justify-end gap-2 pt-3 text-body-b8 text-primary")}>{t("reviewHealth")}<Icon icon={ExternalLink} size="xs" /></Link></section>;
}
