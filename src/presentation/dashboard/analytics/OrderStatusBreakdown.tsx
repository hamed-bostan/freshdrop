import { getLocale, getTranslations } from "next-intl/server";
import type { OrderStatusCount } from "@/src/domain/entities/Analytics";
import type { OrderStatus } from "@/src/domain/entities/Order";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

type OrderStatusBreakdownProps = {
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

/**
 * Label per status, in the *raw status* vocabulary the orders list's filter uses
 * (`dashOrders.filterStatus*`) rather than the badge's. `OrderStatusBadge` folds a
 * status together with its delivery stage — an admin's `processing` order reads
 * "In progress" where a shopper's reads "Shipped" — which is the wrong vocabulary
 * for a breakdown that counts statuses and links into a `?status=` filter.
 */
const STATUS_LABEL_KEYS = {
  completed: "filterStatusCompleted",
  processing: "filterStatusProcessing",
  cancelled: "filterStatusCancelled",
  return_requested: "filterStatusReturnRequested",
  refunded: "filterStatusRefunded",
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
export async function OrderStatusBreakdown({ breakdown }: OrderStatusBreakdownProps) {
  const t = await getTranslations("dashAnalytics");
  const tOrders = await getTranslations("dashOrders");
  const locale = (await getLocale()) as Locale;

  const total = breakdown.reduce((sum, slice) => sum + slice.orders, 0);
  // Statuses nothing landed in are dropped from the *list* but kept in the total
  // above — a legend of five rows where three read "0" is noise, and the bar is
  // already the answer to "what proportion".
  const present = breakdown.filter((slice) => slice.orders > 0);

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{t("statusBreakdown")}</h2>
        <p className="text-body-b8 text-muted-foreground">
          {t("ordersTotal", { count: formatNumber(total, locale) })}
        </p>
      </div>

      {total > 0 ? (
        <>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
            {present.map((slice) => (
              <div
                key={slice.status}
                className={STATUS_BARS[slice.status]}
                style={{ width: `${(slice.orders / total) * 100}%` }}
                title={`${tOrders(STATUS_LABEL_KEYS[slice.status])} — ${formatNumber(slice.orders, locale)}`}
              />
            ))}
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {present.map((slice) => (
              <li key={slice.status}>
                <Link
                  href={`/dashboard/orders?status=${slice.status}`}
                  className="flex items-center gap-3 rounded-card-md py-1 transition-colors hover:bg-muted"
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${STATUS_BARS[slice.status]}`} />
                  <span className="min-w-0 flex-1 truncate text-body-b7 text-foreground">
                    {tOrders(STATUS_LABEL_KEYS[slice.status])}
                  </span>
                  <span className="text-body-b8 text-muted-foreground">
                    {t("percentOfOrders", { percent: Math.round((slice.orders / total) * 100) })}
                  </span>
                  <span className="w-20 text-end text-body-b7 text-foreground">
                    {formatNumber(slice.orders, locale)}
                  </span>
                  {/* Revenue alongside the count, because they diverge and the
                      divergence is the story: a handful of large refunds and a
                      pile of small completed orders look identical by count. */}
                  <span className="w-24 text-end text-body-b8 text-muted-foreground">
                    {formatMoney(slice.revenue, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-6 pb-6 text-center text-body-b7 text-muted-foreground">{t("noOrders")}</p>
      )}
    </section>
  );
}
