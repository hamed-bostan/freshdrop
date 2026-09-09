import { getTranslations } from "next-intl/server";

import {
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
  hasAdminOrderFilters,
  type AdminOrderFilters,
  type AdminOrderSort,
} from "@/src/domain/entities/AdminOrderFilters";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import type { Page } from "@/src/domain/entities/Pagination";
import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import { Link } from "@/src/i18n/navigation";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import {
  ListPager,
  ListSearchInput,
  ListSortSelect,
  type ListSortOption,
} from "@/src/presentation/dashboard/list";

import { OrderBulkActions } from "./OrderBulkActions";
import { OrdersFilterBar } from "./OrdersFilterBar";
import { OrdersSummaryCards } from "./OrdersSummaryCards";
import { OrdersTable } from "./OrdersTable";

type OrdersScreenProps = {
  /** One page of orders plus the total behind it. */
  orders: Page<Order>;
  /** Per-customer order summaries, used only to label each row with who placed it. */
  customers: CustomerOrderSummary[];
  /** The filters this page was fetched with, to distinguish "no orders" from "no matches". */
  filters: AdminOrderFilters;
  /**
   * Whether the viewer may act on orders. Decides whether the selection column and
   * its action bar are drawn — the list itself is readable by anyone with
   * dashboard access. Presentation only: the bulk endpoint checks for itself.
   */
  canFulfill: boolean;
  /**
   * Queue counts for the summary cards and the status filter's per-option numbers.
   * Unfiltered — they describe the store, not this page (see `OrdersSummaryCards`).
   */
  counts: OrderPipelineCounts;
};

/**
 * Admin orders list. Presentational: the dashboard page fetches one page over the
 * REST API (BFF) during server render and passes it in. Search, status filter,
 * ordering and paging live in the URL, so changing any of them re-runs this
 * render. Each row links to the order's detail route, where the stage/return/pick
 * actions live; those writes re-run the render via `router.refresh()`. Either way
 * the server stays the single source of truth — no client-side data cache.
 *
 * The `customers` summaries only label each row with who placed the order; the
 * "top customers" ranking lives on the dashboard overview, not here.
 */
export async function OrdersScreen({
  orders,
  customers,
  filters,
  canFulfill,
  counts,
}: OrdersScreenProps) {
  const t = await getTranslations("dashOrders");
  const tList = await getTranslations("dashList");
  const tAnalytics = await getTranslations("dashAnalytics");

  // Look up each order's customer by the user who placed it, so the table can
  // label rows by name instead of a raw id.
  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));
  const isFiltered = hasAdminOrderFilters(filters);

  const sortOptions: ListSortOption<AdminOrderSort>[] = [
    { sort: "placedAt", direction: "desc", label: t("sortNewest") },
    { sort: "placedAt", direction: "asc", label: t("sortOldest") },
    { sort: "total", direction: "desc", label: t("sortTotalHigh") },
    { sort: "total", direction: "asc", label: t("sortTotalLow") },
  ];

  return (
    <div className="@container flex min-w-0 flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[clamp(1.75rem,4vw,2rem)] font-bold leading-[1.2] text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("summary", { count: orders.total })}</p>
        </div>
        <ExportCsvLink resource="orders" label={tAnalytics("exportCsv")} />
      </div>

      {/* Above the toolbar, not below it: the cards are how someone *arrives* at a
          filtered list, so they have to sit before the controls that refine one. */}
      <OrdersSummaryCards counts={counts} />

      {/* Search, filters, rows, and pagination form one data surface. Page-level
          actions and the queue summary remain outside because they affect more
          than the currently displayed table slice. */}
      <BulkSelectionProvider ids={orders.items.map((order) => order.id)}>
        {orders.items.length > 0 && canFulfill ? (
            <BulkActionBar>
              <OrderBulkActions />
            </BulkActionBar>
        ) : null}
        <OrdersTable
          orders={orders.items}
          customersById={customersById}
          canFulfill={canFulfill}
          toolbar={(
            <section aria-label={t("searchLabel")} className="min-w-0 space-y-3">
              <div className="flex min-w-0 flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center">
                <ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 sm:max-w-none [&_input]:h-11 sm:[&_input]:h-10" />
                <div className="min-w-0 shrink-0 [&_select]:min-h-11 [&_select]:w-full">
                  <ListSortSelect label={t("sortLabel")} options={sortOptions} defaultSort={DEFAULT_ADMIN_ORDER_SORT} defaultDirection={DEFAULT_ADMIN_ORDER_DIRECTION} />
                </div>
              </div>
              <div className="border-t border-border pt-3">
                {/* The filters are one client island: they all write query params,
                    and resolve their own translated labels. */}
                <OrdersFilterBar pipelineCounts={counts.counts} />
              </div>
            </section>
          )}
          emptyState={(
            <div className="px-6 py-16 text-center">
              <p className="text-body-b4 text-foreground">
                {isFiltered ? tList("noResultsTitle") : t("emptyTitle")}
              </p>
              <p className="mt-1 text-body-b6 text-muted-foreground">
                {isFiltered ? tList("noResultsBody") : t("emptyBody")}
              </p>
              {isFiltered && <Link href="/dashboard/orders" className="mt-4 inline-flex min-h-11 items-center rounded-button px-4 text-body-b7 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t("filterReset")}</Link>}
            </div>
          )}
          footer={<ListPager page={orders} />}
        />
      </BulkSelectionProvider>
    </div>
  );
}
