import { getLocale, getTranslations } from "next-intl/server";
import type { OrderStatusCount } from "@/src/domain/entities/Analytics";
import type { OrderStatus } from "@/src/domain/entities/Order";
import type { OrderPipelineStage } from "@/src/domain/entities/OrderPipelineStage";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

type OrderStatusBreakdownProps = {
  /** Condensed operational summary for the dashboard; Analytics retains richer figures. */
  compact?: boolean;
  /** One row per status, including the ones no order landed in (the adapter fills them). */
  breakdown: OrderStatusCount[];
};

/**
 * Bar colour per status. Deliberately not the badge palette: the badge answers
 * "what state is this one order in" and lives among neutral table text, while these
 * sit side by side in a single bar where the only job is telling five bands apart.
 * The two outcomes that cost money (cancelled, refunded) take the warning and error
 * tones, so a bad month is visible before any number is read.
 */
const STATUS_BARS: Record<OrderStatus, string> = {
  completed: "bg-primary",
  processing: "bg-info-foreground",
  return_requested: "bg-warning-foreground",
  cancelled: "bg-error-foreground",
  refunded: "bg-muted-foreground",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  completed: "var(--color-primary)",
  processing: "var(--color-info-foreground)",
  return_requested: "var(--color-warning-foreground)",
  cancelled: "var(--color-error-foreground)",
  refunded: "var(--color-muted-foreground)",
};

/**
 * The pipeline stage each status corresponds to — what the row is labelled with,
 * and what its link filters the orders list to.
 *
 * Every status maps onto exactly one stage, `processing` onto the umbrella that
 * spans its three milestones (see `OrderPipelineStage`). That correspondence is
 * what lets a row link somewhere honest: clicking "9 cancelled" has to land on
 * those nine orders and no others.
 *
 * Not the badge's vocabulary: `OrderStatusBadge` folds a status together with its
 * delivery stage — an admin's `processing` order reads "In progress" where a
 * shopper's reads "Shipped" — which is the wrong vocabulary for a breakdown that
 * counts statuses.
 */
const STATUS_PIPELINE = {
  completed: "delivered",
  processing: "in_progress",
  cancelled: "cancelled",
  return_requested: "return_requested",
  refunded: "refunded",
} as const satisfies Record<OrderStatus, OrderPipelineStage>;

const STATUS_LABEL_KEYS = {
  completed: "filterPipelineDelivered",
  processing: "filterPipelineInProgress",
  cancelled: "filterPipelineCancelled",
  return_requested: "filterPipelineReturnRequested",
  refunded: "filterPipelineRefunded",
} as const satisfies Record<OrderStatus, string>;

/**
 * How the period's orders ended up — a single proportional bar, then the numbers.
 *
 * Counts every status, including the ones that earned nothing. That is the whole
 * point of putting it next to the revenue tiles: cancellations and refunds are
 * invisible in a revenue figure by construction, so a month that fell can only be
 * explained by a panel that counts the orders revenue doesn't.
 *
 * Each row links into the orders list filtered to that status, for the same reason
 * the low-stock tile links to its rows: "9 cancelled" is a fact, and the nine
 * orders are the thing you can actually do something about.
 */
export async function OrderStatusBreakdown({ breakdown, compact = false }: OrderStatusBreakdownProps) {
  const t = await getTranslations("dashAnalytics");
  const tOrders = await getTranslations("dashOrders");
  const locale = (await getLocale()) as Locale;

  const total = breakdown.reduce((sum, slice) => sum + slice.orders, 0);
  // Statuses nothing landed in are dropped from the *list* but kept in the total
  // above — a legend of five rows where three read "0" is noise, and the bar is
  // already the answer to "what proportion".
  const present = breakdown.filter((slice) => slice.orders > 0);
  const donutStops = present.reduce<{ stops: string[]; cursor: number }>((result, slice) => {
    const end = result.cursor + (slice.orders / total) * 100;
    return { stops: [...result.stops, `${STATUS_COLORS[slice.status]} ${result.cursor}% ${end}%`], cursor: end };
  }, { stops: [], cursor: 0 }).stops.join(", ");

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{t("statusBreakdown")}</h2>
        {!compact ? (
          <p className="text-body-b8 text-muted-foreground">
            {t("ordersTotal", { count: formatNumber(total, locale) })}
          </p>
        ) : null}
      </div>

      {total > 0 ? (
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[minmax(8rem,.85fr)_minmax(10rem,1fr)]">
          <div className="relative mx-auto flex size-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${donutStops})` }} aria-hidden>
            <div className="flex size-[5.5rem] flex-col items-center justify-center rounded-full bg-background"><strong className="text-heading-h3">{formatNumber(total, locale)}</strong><span className="text-body-b10 text-muted-foreground">{t("totalLabel")}</span></div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {present.map((slice) => (
              <li key={slice.status}>
                <Link
                  href={`/dashboard/orders?pipeline=${STATUS_PIPELINE[slice.status]}`}
                  className="flex items-center gap-3 rounded-card-md py-1 transition-colors hover:bg-muted"
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${STATUS_BARS[slice.status]}`} />
                  <span className="min-w-0 flex-1 truncate text-body-b7 text-foreground">
                    {tOrders(STATUS_LABEL_KEYS[slice.status])}
                  </span>
                  {!compact ? (
                    <span className="text-body-b8 text-muted-foreground">
                      {t("percentOfOrders", { percent: Math.round((slice.orders / total) * 100) })}
                    </span>
                  ) : null}
                  <span className="w-10 text-end text-body-b8 text-foreground">
                    {formatNumber(slice.orders, locale)}
                  </span>
                  {!compact ? (
                    <span className="w-20 text-end text-body-b9 text-muted-foreground">
                      {formatMoney(slice.revenue, locale)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{t("noOrders")}</p>
      )}
    </section>
  );
}
