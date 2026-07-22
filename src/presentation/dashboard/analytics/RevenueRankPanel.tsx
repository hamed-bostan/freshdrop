import Image from "next/image";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Thumbnail } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

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
}: RevenueRankPanelProps) {
  const locale = (await getLocale()) as Locale;
  const leader = rows.reduce((max, row) => Math.max(max, row.revenue), 0);

  return (
    <section className="rounded-card-lg border border-border p-4">
      <h2 className="text-body-b5 text-foreground">{heading}</h2>

      {rows.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-1">
          {rows.map((row) => {
            const content = (
              <>
                {/* The bar sits behind the row rather than beside it, so the text
                    keeps its full width on a narrow dashboard column and the
                    proportion is still readable at a glance. */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 start-0 rounded-card-md bg-accent"
                  style={{ width: leader > 0 ? `${(row.revenue / leader) * 100}%` : "0%" }}
                />
                <span className="relative flex w-full items-center gap-3">
                  {row.imageUrl ? (
                    <Thumbnail as="span" className="size-9 shrink-0">
                      <Image
                        src={row.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="size-full object-contain"
                      />
                    </Thumbnail>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-b7 text-foreground">{row.label}</span>
                    <span className="block text-body-b8 text-muted-foreground">
                      {unitsLabel(formatNumber(row.units, locale))}
                    </span>
                  </span>
                  <span className="text-body-b7 text-foreground">
                    {formatMoney(row.revenue, locale)}
                  </span>
                </span>
              </>
            );

            const frame = "relative flex items-center overflow-hidden rounded-card-md p-2";

            return (
              <li key={row.id}>
                {row.href ? (
                  <Link href={row.href} className={`${frame} transition-colors hover:bg-muted`}>
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
        <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}
