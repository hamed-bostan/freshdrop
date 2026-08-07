import { ArrowDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  customerAverageOrderValue,
  type CustomerOrderSummary,
} from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { maskPhoneNumber } from "@/src/lib/maskPhoneNumber";
import { cn } from "@/src/lib/utils";
import {
  Avatar,
  DataGridBody,
  DataGridHeader,
  DataTable,
  focusRing,
  Icon,
} from "@/src/presentation/design-system";

type CustomersTableProps = {
  /** Customer summaries, already sorted and paged by the server. */
  customers: CustomerOrderSummary[];
  /** Paging controls attached to the table frame. */
  footer?: React.ReactNode;
};

/**
 * Shared grid template for the customers list. Identity owns the avatar, name
 * and masked phone; the remaining columns are the customer-value measures an
 * operator compares across rows.
 */
const CUSTOMERS_ROW_GRID =
  "grid grid-cols-[minmax(18rem,1.8fr)_minmax(7rem,0.7fr)_minmax(9rem,0.9fr)_minmax(9rem,0.9fr)_auto] items-center gap-5";

/**
 * The admin customers list: one whole-row link per customer so the primary
 * action—opening the customer—is both obvious and generous. Phone numbers are
 * masked because this is a broad list view; the authorized detail route owns the
 * full contact value. Numeric columns use tabular figures and end alignment for
 * quick comparison.
 */
export function CustomersTable({ customers, footer }: CustomersTableProps) {
  const t = useTranslations("dashCustomers");
  const locale = useLocale();

  return (
    <DataTable minWidthClassName="min-w-[52rem]" footer={footer}>
      <DataGridHeader template={CUSTOMERS_ROW_GRID}>
        <span>{t("colCustomer")}</span>
        <span className="text-end">{t("colOrders")}</span>
        <span className="text-end">{t("colAverageOrder")}</span>
        <span className="inline-flex items-center justify-end gap-1 text-end">
          {t("colSpent")}
          <Icon icon={ArrowDown} size="xs" aria-hidden />
        </span>
        <span aria-hidden className="w-4" />
      </DataGridHeader>
      <DataGridBody>
        {customers.map((customer) => (
          <Link
            key={customer.userId}
            href={`/dashboard/customers/${customer.userId}`}
            aria-label={t("viewCustomerAria", { name: customer.name })}
            className={cn(
              CUSTOMERS_ROW_GRID,
              focusRing,
              "group bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={customer.name} className="size-10 shrink-0">
                {customer.avatarUrl ? (
                  <Image
                    src={customer.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-full object-cover"
                  />
                ) : null}
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-body-b7 text-foreground transition-colors group-hover:text-primary">
                  {customer.name}
                </span>
                <span
                  dir={customer.phone ? "ltr" : undefined}
                  className="block w-fit max-w-full truncate text-body-b6 tabular-nums text-muted-foreground"
                >
                  {customer.phone ? maskPhoneNumber(customer.phone) : t("noPhone")}
                </span>
              </span>
            </span>
            <span className="text-end text-body-b6 tabular-nums text-muted-foreground">
              {formatNumber(customer.orderCount, locale)}
            </span>
            <span className="text-end text-body-b6 tabular-nums text-muted-foreground">
              {formatMoney(customerAverageOrderValue(customer), locale)}
            </span>
            <span className="text-end text-body-b8 tabular-nums text-foreground">
              {formatMoney(customer.totalSpent, locale)}
            </span>
            <Icon
              icon={ChevronRight}
              size="xs"
              className="text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
          </Link>
        ))}
      </DataGridBody>
    </DataTable>
  );
}
