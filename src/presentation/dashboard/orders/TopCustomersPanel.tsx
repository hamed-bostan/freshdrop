import { getLocale, getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";

type TopCustomersPanelProps = {
  /** Customers ranked by total spend (highest first) — the parent screen passes them pre-sorted. */
  customers: CustomerOrderSummary[];
};

/**
 * How many top spenders to spotlight. Enough to highlight the best customers
 * without turning the panel into a second full table.
 */
const TOP_COUNT = 5;

/**
 * Ranked "most buying" customers, highest total spend first. Presentational —
 * the Orders screen supplies the already-ranked summaries; this only shows the
 * leading few.
 */
export async function TopCustomersPanel({ customers }: TopCustomersPanelProps) {
  const t = await getTranslations("dashOrders");
  const locale = await getLocale();
  const top = customers.slice(0, TOP_COUNT);

  return (
    <section className="rounded-card-lg border border-border p-4">
      <div>
        <h2 className="text-body-b5 text-foreground">{t("topCustomers")}</h2>
        <p className="text-body-b8 text-muted-foreground">{t("rankedBySpend")}</p>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {top.map((customer, index) => (
          <li key={customer.userId} className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-body-b8 text-muted-foreground">
              {formatNumber(index + 1, locale)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-b7 text-foreground">{customer.name}</p>
              {customer.phone ? (
                <p className="truncate text-body-b8 text-muted-foreground">{customer.phone}</p>
              ) : null}
            </div>
            <div className="text-end">
              <p className="text-body-b7 text-foreground">{formatMoney(customer.totalSpent, locale)}</p>
              <p className="text-body-b8 text-muted-foreground">
                {t("orderCount", { count: customer.orderCount })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
