import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import {
  DataGridBody,
  DataGridHeader,
  DataTable,
  focusRing,
  Icon,
} from "@/src/presentation/design-system";

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
 * it so the columns line up. Columns: rank, customer, phone, orders, total spent, and
 * the trailing chevron affordance.
 */
const CUSTOMERS_ROW_GRID =
  "grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-4";

/**
 * The admin customers list — a flat table of linkable rows. Built on a shared CSS grid
 * rather than a `<table>` so each whole row can be a single link to the customer-detail
 * route (a `<tr>` can't be); the header and rows align on {@link CUSTOMERS_ROW_GRID},
 * and it scrolls horizontally on narrow viewports rather than crushing the columns. The
 * leading `#` column shows each customer's rank by total spend; the numeric columns
 * (orders, spend) are end-aligned with tabular figures for clean scanning.
 */
export function CustomersTable({ rows }: CustomersTableProps) {
  const t = useTranslations("dashCustomers");
  const locale = useLocale();

  return (
    <DataTable minWidthClassName="min-w-[48rem]">
      <DataGridHeader template={CUSTOMERS_ROW_GRID}>
        <span>{t("colRank")}</span>
        <span>{t("colCustomer")}</span>
        <span>{t("colPhone")}</span>
        <span className="text-end">{t("colOrders")}</span>
        <span className="text-end">{t("colSpent")}</span>
        <span aria-hidden className="w-4" />
      </DataGridHeader>
      <DataGridBody>
        {rows.map(({ customer, rank }) => (
          <Link
            key={customer.userId}
            href={`/dashboard/customers/${customer.userId}`}
            aria-label={t("viewCustomerAria", { name: customer.name })}
            className={cn(
              CUSTOMERS_ROW_GRID,
              focusRing,
              "bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50",
            )}
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
            <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:-scale-x-100" />
          </Link>
        ))}
      </DataGridBody>
    </DataTable>
  );
}
