import { getTranslations } from "next-intl/server";
import {
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
  hasAdminOrderFilters,
  type AdminOrderFilters,
  type AdminOrderSort,
} from "@/src/domain/entities/AdminOrderFilters";
import type { Order } from "@/src/domain/entities/Order";
import {
  ORDER_PIPELINE_STAGES,
  type OrderPipelineStage,
} from "@/src/domain/entities/OrderPipelineStage";
import type { Page } from "@/src/domain/entities/Pagination";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import {
  ListFilterSelect,
  ListPager,
  ListSearchInput,
  ListSortSelect,
  ListToolbar,
  type ListSortOption,
} from "@/src/presentation/dashboard/list";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { OrdersTable } from "./OrdersTable";

type OrdersScreenProps = {
  /** One page of orders plus the total behind it. */
  orders: Page<Order>;
  /** Per-customer order summaries, used only to label each row with who placed it. */
  customers: CustomerOrderSummary[];
  /** The filters this page was fetched with, to distinguish "no orders" from "no matches". */
  filters: AdminOrderFilters;
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
export async function OrdersScreen({ orders, customers, filters }: OrdersScreenProps) {
  const t = await getTranslations("dashOrders");
  const tList = await getTranslations("dashList");
  const tAnalytics = await getTranslations("dashAnalytics");

  // Look up each order's customer by the user who placed it, so the table can
  // label rows by name instead of a raw id.
  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));
  const isFiltered = hasAdminOrderFilters(filters);

  // The filter's vocabulary is the pipeline stage, not the raw status: an
  // operator asks "what's still waiting to be confirmed" and "what's on a van",
  // and neither is a status — both are a status *and* a milestone. See
  // `OrderPipelineStage`.
  const pipelineLabels: Record<OrderPipelineStage, string> = {
    pending: t("filterPipelinePending"),
    confirmed: t("filterPipelineConfirmed"),
    out_for_delivery: t("filterPipelineOutForDelivery"),
    delivered: t("filterPipelineDelivered"),
    return_requested: t("filterPipelineReturnRequested"),
    cancelled: t("filterPipelineCancelled"),
    refunded: t("filterPipelineRefunded"),
  };

  const sortOptions: ListSortOption<AdminOrderSort>[] = [
    { sort: "placedAt", direction: "desc", label: t("sortNewest") },
    { sort: "placedAt", direction: "asc", label: t("sortOldest") },
    { sort: "total", direction: "desc", label: t("sortTotalHigh") },
    { sort: "total", direction: "asc", label: t("sortTotalLow") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count: orders.total })}</p>
      </div>

      <ListToolbar
        search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
        filters={
          <>
            <ListFilterSelect
              paramName="pipeline"
              label={t("filterStatusLabel")}
              options={[
                { value: "", label: t("filterStatusAll") },
                ...ORDER_PIPELINE_STAGES.map((stage) => ({
                  value: stage,
                  label: pipelineLabels[stage],
                })),
              ]}
            />
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
        <>
          <OrdersTable orders={orders.items} customersById={customersById} />
          <ListPager page={orders} />
        </>
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
