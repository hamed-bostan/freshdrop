import { getLocale, getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";

type CustomersTableProps = {
  /** Customer summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/**
 * Shared grid template for the customers list — the header row and every data row use
 * it so the columns line up. Columns: customer, phone, orders, total spent, last order.
 */
const CUSTOMERS_ROW_GRID =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_minmax(0,1fr)] items-center gap-4";

/**
 * The admin customers list — a flat, read-only table (there is no customer-detail
 * route, so rows aren't links). Built on a shared CSS grid rather than a `<table>` so
 * the header and rows align on {@link CUSTOMERS_ROW_GRID}; scrolls horizontally on
 * narrow viewports rather than crushing the columns. Numeric columns (orders, spend)
 * are end-aligned for tabular scanning.
 */
export async function CustomersTable({ customers }: CustomersTableProps) {
  const t = await getTranslations("dashCustomers");
  const locale = await getLocale();

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
            <span>{t("colCustomer")}</span>
            <span>{t("colPhone")}</span>
            <span className="text-end">{t("colOrders")}</span>
            <span className="text-end">{t("colSpent")}</span>
            <span className="text-end">{t("colLastOrder")}</span>
          </div>
          <div className="divide-y divide-border">
            {customers.map((customer) => (
              <div
                key={customer.userId}
                className={cn(CUSTOMERS_ROW_GRID, "bg-background px-4 py-3")}
              >
                <span className="min-w-0 truncate text-body-b7 text-foreground">
                  {customer.name}
                </span>
                <span className="truncate text-body-b6 text-muted-foreground">
                  {customer.phone || t("noPhone")}
                </span>
                <span className="text-end text-body-b7 text-foreground">
                  {formatNumber(customer.orderCount, locale)}
                </span>
                <span className="text-end text-body-b7 text-foreground">
                  {formatMoney(customer.totalSpent, locale)}
                </span>
                <span className="truncate text-end text-body-b6 text-muted-foreground">
                  {formatOrderDate(customer.lastOrderAt, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
