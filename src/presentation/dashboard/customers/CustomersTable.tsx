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
  toolbar?: React.ReactNode;
};

/**
 * Shared grid template for the customers list. Identity owns the avatar, name
 * and masked phone; the remaining columns are the customer-value measures an
 * operator compares across rows.
 */
const CUSTOMERS_ROW_GRID =
  "grid grid-cols-3 items-center gap-x-3 gap-y-4 @min-[48rem]:grid-cols-[minmax(0,1.8fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)_1rem] @min-[48rem]:gap-5";

/**
 * The admin customers list: one whole-row link per customer so the primary
 * action—opening the customer—is both obvious and generous. Phone numbers are
 * masked because this is a broad list view; the authorized detail route owns the
 * full contact value. Numeric columns use tabular figures and end alignment for
 * quick comparison.
 */
export function CustomersTable({ customers, footer, toolbar }: CustomersTableProps) {
  const t = useTranslations("dashCustomers");
  const locale = useLocale();

  return (
    <DataTable className="@container min-w-0 bg-background" footer={footer} toolbar={toolbar}>
      <DataGridHeader template={CUSTOMERS_ROW_GRID} className="hidden @min-[48rem]:grid" aria-hidden>
        <span>{t("colCustomer")}</span>
        <span className="text-end">{t("colOrders")}</span>
        <span className="text-end">{t("colAverageOrder")}</span>
        <span className="inline-flex items-center justify-end gap-1 text-end">
          {t("colSpent")}
          <Icon icon={ArrowDown} size="xs" aria-hidden />
        </span>
        <span aria-hidden className="w-4" />
      </DataGridHeader>
      <ul aria-label={t("heading")} className="divide-y divide-border">
        {customers.map((customer) => (
          <li key={customer.userId}>
            <Link
              href={`/dashboard/customers/${customer.userId}`}
              aria-label={t("viewCustomerAria", { name: customer.name })}
              className={cn(
                CUSTOMERS_ROW_GRID,
                focusRing,
                "group relative px-4 py-5 transition-colors hover:bg-surface-sunken/50 focus-visible:-outline-offset-2 motion-reduce:transition-none @min-[48rem]:py-4",
              )}
            >
              <span className="col-span-3 flex min-w-0 items-center gap-3 pe-6 @min-[48rem]:col-span-1 @min-[48rem]:pe-0">
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
                  <span className="block break-words text-body-b8 text-foreground group-hover:text-primary">
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
              <span className="min-w-0 self-start @min-[48rem]:self-center break-words text-body-b6 tabular-nums text-foreground @min-[48rem]:text-end">
                <span className="mb-1 block text-body-b10 text-muted-foreground @min-[48rem]:sr-only">{t("colOrders")}</span>
                {formatNumber(customer.orderCount, locale)}
              </span>
              <span className="min-w-0 self-start @min-[48rem]:self-center break-words text-body-b6 tabular-nums text-foreground @min-[48rem]:text-end">
                <span className="mb-1 block text-body-b10 text-muted-foreground @min-[48rem]:sr-only">{t("colAverageOrder")}</span>
                {formatMoney(customerAverageOrderValue(customer), locale)}
              </span>
              <span className="min-w-0 self-start @min-[48rem]:self-center break-words text-body-b8 tabular-nums text-foreground @min-[48rem]:text-end">
                <span className="mb-1 block text-body-b10 text-muted-foreground @min-[48rem]:sr-only">{t("colSpent")}</span>
                {formatMoney(customer.totalSpent, locale)}
              </span>
              <Icon
                icon={ChevronRight}
                size="xs"
                aria-hidden
                className="absolute end-4 top-8 text-muted-foreground rtl:-scale-x-100 @min-[48rem]:static"
              />
            </Link>
          </li>
        ))}
      </ul>
    </DataTable>
  );
}
