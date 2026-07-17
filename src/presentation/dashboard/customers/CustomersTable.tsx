import { useLocale, useTranslations } from "next-intl";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";

/** One customer paired with their 1-based position in the full spend ranking. */
type CustomerRow = {
  rank: number;
  customer: CustomerOrderSummary;
};

type CustomersTableProps = {
  /** Rows to render — the spend ranking, possibly narrowed by the search filter. */
  rows: CustomerRow[];
};

/**
 * Shared grid template for the customers list — the header row and every data row use
 * it so the columns line up. Columns: rank, customer, phone, orders, total spent.
 */
const CUSTOMERS_ROW_GRID =
  "grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4";

/**
 * The admin customers list — a flat, read-only table (there is no customer-detail
 * route, so rows aren't links). Built on a shared CSS grid rather than a `<table>` so
 * the header and rows align on {@link CUSTOMERS_ROW_GRID}; scrolls horizontally on
 * narrow viewports rather than crushing the columns. The leading `#` column shows each
 * customer's rank by total spend; the numeric columns (orders, spend) are end-aligned
 * with tabular figures for clean scanning.
 */
export function CustomersTable({ rows }: CustomersTableProps) {
  const t = useTranslations("dashCustomers");
  const locale = useLocale();

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <div className="overflow-x-auto">
        <div className="min-w-[48rem]">
          <div
            className={cn(
              CUSTOMERS_ROW_GRID,
              "bg-surface-sunken px-4 py-3 text-body-b8 text-muted-foreground",
            )}
          >
            <span>{t("colRank")}</span>
            <span>{t("colCustomer")}</span>
            <span>{t("colPhone")}</span>
            <span className="text-end">{t("colOrders")}</span>
            <span className="text-end">{t("colSpent")}</span>
          </div>
          <div className="divide-y divide-border">
            {rows.map(({ customer, rank }) => (
              <div
                key={customer.userId}
                className={cn(CUSTOMERS_ROW_GRID, "bg-background px-4 py-3")}
              >
                <span className="text-body-b6 tabular-nums text-muted-foreground">
                  {formatNumber(rank, locale)}
                </span>
                <span className="min-w-0 truncate text-body-b7 text-foreground">
                  {customer.name}
                </span>
                <span className="truncate text-body-b6 text-muted-foreground">
                  {customer.phone || t("noPhone")}
                </span>
                <span className="text-end text-body-b6 tabular-nums text-muted-foreground">
                  {formatNumber(customer.orderCount, locale)}
                </span>
                <span className="text-end text-body-b8 tabular-nums text-foreground">
                  {formatMoney(customer.totalSpent, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
