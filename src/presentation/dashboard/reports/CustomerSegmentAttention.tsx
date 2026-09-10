import { ExternalLink, MoonStar, Sparkles, TrendingDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

import { ReportStatusBadge } from "./ReportStatusBadge";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

export async function CustomerSegmentAttention({ segments, locale }: { segments: CustomerSegmentsWire["segments"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments");
  const ids = ["at_risk", "dormant", "new_customers"] as const;
  const badgeStyles = {
    at_risk: { icon: TrendingDown, tone: "border-destructive/20 bg-error text-destructive" },
    dormant: { icon: MoonStar, tone: "border-warning/30 bg-warning/15 text-warning-foreground" },
    new_customers: { icon: Sparkles, tone: "border-primary/20 bg-accent text-primary" },
  };

  return (
    <section className="flex flex-col rounded-card-lg border border-border bg-background p-4 md:p-6">
      <h2 className="text-heading-h3">{t("needsAttention")}</h2>
      <div className="mt-4">
        {ids.map((id) => {
          const segment = segments.find((item) => item.id === id);
          if (!segment) return null;
          const badge = badgeStyles[id];

          return (
            <Link
              key={id}
              href={`/dashboard/customers?segment=${id}`}
              className={cn(focusRing, "relative grid grid-cols-1 gap-2 rounded-card-md px-3 py-4 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-border last:after:hidden hover:bg-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6")}
            >
              <span className="min-w-0">
                <span className="block text-body-b10 font-semibold">{t(`segment.${id}`)}</span>
                <span className="block text-body-b10 text-muted-foreground">
                  {t("attentionDetail", { customers: formatNumber(segment.customers, locale), revenue: formatMoney(segment.revenue, locale) })}
                </span>
              </span>
              <ReportStatusBadge icon={badge.icon} label={t(`attention.${id}`)} tone={badge.tone} className="justify-self-end" />
            </Link>
          );
        })}
      </div>
      <Link href="/dashboard/customers" className={cn(focusRing, "mt-6 flex items-center justify-end gap-2 border-t border-border pt-4 text-body-b8 font-medium text-primary")}>
        {t("reviewHealth")}
        <Icon icon={ExternalLink} size="xs" />
      </Link>
    </section>
  );
}
