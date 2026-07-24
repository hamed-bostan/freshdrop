import { getTranslations } from "next-intl/server";
import {
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
  hasAdminOrderFilters,
  type AdminOrderFilters,
  type AdminOrderSort,
} from "@/src/domain/entities/AdminOrderFilters";
import type { Order } from "@/src/domain/entities/Order";
import type { Page } from "@/src/domain/entities/Pagination";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { OrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import {
  ListPager,
  ListSearchInput,
  ListSortSelect,
  ListToolbar,
  type ListSortOption,
} from "@/src/presentation/dashboard/list";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("summary", { count: orders.total })}</p>
        </div>
      </div>

      {/* Above the toolbar, not below it: the cards are how someone *arrives* at a
          filtered list, so they have to sit before the controls that refine one. */}
      <OrdersSummaryCards counts={counts} />

      <ListToolbar
        search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
        filters={
          <>
            {/* The filters are one client island: they all write query params,
                and the labels they need are resolved inside it rather than
                threaded through as props. */}
            <OrdersFilterBar pipelineCounts={counts.counts} />
            <ListSortSelect
              label={t("sortLabel")}
              options={sortOptions}
              defaultSort={DEFAULT_ADMIN_ORDER_SORT}
              defaultDirection={DEFAULT_ADMIN_ORDER_DIRECTION}
            />
            {/* Exports the *filtered* set, not the page: the link carries the
                current query string, so whatever narrows this table narrows the
                file (see `ExportCsvLink`). */}
            <ExportCsvLink resource="orders" label={tAnalytics("exportCsv")} />
          </>
        }
      />

      {orders.items.length > 0 ? (
        // The provider wraps both the bar and the table so a row's checkbox and
        // the actions above it share one selection. The rows stay server-rendered
        // inside it — only the checkboxes and the bar are client islands.
        <BulkSelectionProvider ids={orders.items.map((order) => order.id)}>
          {canFulfill ? (
            <BulkActionBar>
              <OrderBulkActions />
            </BulkActionBar>
          ) : null}
          <OrdersTable
            orders={orders.items}
            customersById={customersById}
            canFulfill={canFulfill}
          />
          <ListPager page={orders} />
        </BulkSelectionProvider>
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : t("emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
