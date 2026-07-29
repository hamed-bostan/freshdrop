import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Badge, focusRing, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import type { AttentionItem } from "./AttentionItem";

type NeedsAttentionPanelProps = {
  /** One row per signal the overview tracks. A zero-count row is dropped before rendering. */
  items: AttentionItem[];
};

const TONE_TINT: Record<AttentionItem["tone"], string> = {
  warning: "bg-warning text-warning-foreground",
  danger: "bg-error text-error-foreground",
};

/**
 * The consolidated "things to do" strip: pending reviews, low stock, and the
 * order queue's own SLA signals, side by side in one card instead of scattered
 * across separate tiles.
 *
 * Each column is only as trustworthy as the link behind it — the caller
 * computes both the count and the `href` from the *same* filter (see
 * `DashboardOverviewScreen`), the same discipline `OrderStatusBreakdown` and
 * the low-stock tile already follow, so a number here can't promise rows the
 * destination then fails to show.
 *
 * Zero-count rows are dropped rather than shown as "0" — a queue that isn't
 * stalled has nothing to click through to. When nothing is left, the panel
 * says so instead of rendering an empty divided strip.
 */
export async function NeedsAttentionPanel({ items }: NeedsAttentionPanelProps) {
  const t = await getTranslations("dashHome");
  const locale = (await getLocale()) as Locale;

  const active = items.filter((item) => item.count > 0);
  // Only shown when *some* but not all categories need a look — the columns
  // whose count is zero don't each get their own tile (that's noise), they
  // collapse into one reassuring summary instead.

  return (
    <section className="rounded-card-lg border border-border">
      <div className="flex items-center gap-3 p-4 pb-0">
        <h2 className="text-body-b5 text-foreground">{t("attentionHeading")}</h2>
        {/* Counts the *categories* needing a look, not the sum of their items — "2
            things need you" is what an operator scanning the header wants, not a
            number that conflates 25 low-stock products with 1 stale order. */}
        {active.length > 0 ? (
          <Badge variant="error" size="sm">
            {formatNumber(active.length, locale)}
          </Badge>
        ) : null}
        <Link href="/dashboard/activity" className="ms-auto inline-flex items-center gap-1 text-body-b8 text-primary hover:underline">{t("viewAllAlerts")}<Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" /></Link>
      </div>

      {active.length > 0 ? (
        <div className="mt-2 grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {active.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition-colors hover:bg-muted",
                focusRing,
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  TONE_TINT[item.tone],
                )}
              >
                <Icon icon={item.icon} size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-body-b6 text-foreground">{item.title}</p>
                <p className="text-body-b8 text-muted-foreground">{item.detail}</p>
              </div>
              <span className="hidden items-center gap-1 rounded-input border border-primary px-3 py-1.5 text-body-b9 text-primary sm:inline-flex">{item.ctaLabel}<Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-success text-success-foreground">
            <Icon icon={CheckCircle2} size="sm" />
          </div>
          <p className="text-body-b6 text-foreground">{t("attentionAllClearTitle")}</p>
          <p className="text-body-b8 text-muted-foreground">{t("attentionAllClearBody")}</p>
        </div>
      )}
    </section>
  );
}
