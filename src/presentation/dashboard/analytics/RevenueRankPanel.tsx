import Image from "next/image";
import { getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import type { RevenueRankSort } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, Thumbnail } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { RevenueRankSortSelect } from "./RevenueRankSortSelect";

/** One ranked row, flattened from either a `TopProduct` or a `TopCategory`. */
export type RevenueRankRow = {
  id: string;
  label: string;
  /** Product shot, when the ranked thing has one. Categories don't. */
  imageUrl?: string;
  units: number;
  revenue: number;
  /** Where the row leads — the filtered list behind it. Omitted when there's nowhere to go. */
  href?: string;
};

type RevenueRankPanelProps = {
  heading: string;
  rows: RevenueRankRow[];
  /** Shown when the period produced no sales at all. */
  emptyLabel: string;
  /** Formats the units line for a row, e.g. "48 units" — plural-aware, so the caller owns it. */
  unitsLabel: (units: string) => string;
  /** The ordering `rows` already arrived in — the panel only has to reflect it in the control. */
  sort: RevenueRankSort;
  /** The URL param the sort control writes — distinct per panel instance. */
  sortParamName: string;
  sortLabel: string;
  sortOptions: { value: RevenueRankSort; label: string }[];
  /** Where the footer's "view all" link leads — the unfiltered list behind the ranking. */
  viewAllHref: string;
  viewAllLabel: string;
};

/**
 * A "top N by revenue" list — products and categories share it, because they are
 * the same panel with a different noun and the difference between them is one
 * optional thumbnail.
 *
 * Each row carries a proportional bar behind it, scaled to the *leader* rather than
 * to the total. Scaling to the total would make every bar in a healthy, evenly
 * spread catalog a stub, and the question this panel answers is "how far ahead is
 * the top one", which is a comparison between rows.
 *
 * Ranked by revenue, not units — see `IAnalyticsRepository.topProducts`. Both are
 * shown, because they disagree in the interesting cases and the disagreement is
 * the insight: the product with the most units and the least revenue is the one
 * eating the picking time.
 */
export async function RevenueRankPanel({
  heading,
  rows,
  emptyLabel,
  unitsLabel,
  sort,
  sortParamName,
  sortLabel,
  sortOptions,
  viewAllHref,
  viewAllLabel,
}: RevenueRankPanelProps) {
  const locale = (await getLocale()) as Locale;

  return (
    <section className="flex h-full flex-col rounded-card-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{heading}</h2>
        <RevenueRankSortSelect
          paramName={sortParamName}
          value={sort}
          defaultValue="revenue"
          label={sortLabel}
          options={sortOptions}
        />
      </div>

      {rows.length > 0 ? (
        <ol className="mt-5 flex flex-1 flex-col gap-3">
          {rows.map((row, index) => {
            // Only the leader gets picked out — a proportional bar on every row
            // reads as a bar chart, but the question this panel answers is just
            // "who's in front", which a single highlighted row already says.
            const isLeader = index === 0;

            const content = (
              <span className="flex w-full items-center gap-3">
                {row.imageUrl ? (
                  <Thumbnail as="span" className="size-12 shrink-0">
                    <Image
                      src={row.imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-full object-contain"
                    />
                  </Thumbnail>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-b5 text-foreground">{row.label}</span>
                  <span className="block text-body-b8 text-muted-foreground">
                    {unitsLabel(formatNumber(row.units, locale))}
                  </span>
                </span>
                <span className="text-body-b5 text-primary">{formatMoney(row.revenue, locale)}</span>
              </span>
            );

            const frame = cn(
              "flex items-center rounded-card-lg p-4",
              isLeader ? "bg-accent" : "transition-colors hover:bg-muted",
            );

            return (
              <li key={row.id}>
                {row.href ? (
                  <Link href={row.href} className={frame}>
                    {content}
                  </Link>
                ) : (
                  <div className={frame}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-6 flex-1 pb-6 text-center text-body-b7 text-muted-foreground">{emptyLabel}</p>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline"
        >
          {viewAllLabel}
          <Icon icon={ArrowRight} size="xs" className="rtl:-scale-x-100" />
        </Link>
      </div>
    </section>
  );
}
