import { SearchX, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Page } from "@/src/domain/entities/Pagination";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { ListFilterReset, ListPager, ListSearchInput } from "@/src/presentation/dashboard/list";
import { DataTable, Icon } from "@/src/presentation/design-system";

import { CustomersTable } from "./CustomersTable";

type CustomersScreenProps = {
  /** One page of customer summaries, ranked by total spend (highest first). */
  customers: Page<CustomerOrderSummary>;
  /** The search term this page was fetched with, to distinguish "no customers" from "no matches". */
  query?: string;
};

/**
 * Admin customers list. Presentational: the dashboard page fetches one page over
 * the REST API (BFF) during server render and passes it in. The search term and
 * page live in the URL, so changing either re-runs this render — the server stays
 * the single source of truth.
 *
 * A server component now: the search used to be a client-side filter over every
 * customer, which meant shipping the whole list to the browser to hide most of it.
 * Each customer still shows their true position in the full spend ranking, which
 * the summary now carries (`rank`) rather than the row's index supplying it.
 */
export async function CustomersScreen({ customers, query }: CustomersScreenProps) {
  const t = await getTranslations("dashCustomers");
  const tAnalytics = await getTranslations("dashAnalytics");
  const tList = await getTranslations("dashList");
  const isSearching = query != null && query.length > 0;
  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ListSearchInput label={t("searchPlaceholder")} placeholder={t("searchPlaceholder")} className="sm:max-w-md [&_input]:h-11 sm:[&_input]:h-10" />
      <ListFilterReset label={tList("clearFilters")} paramNames={["q"]} className="min-h-11 shrink-0 self-start" />
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.75rem,4vw,2rem)] font-bold leading-[1.2] text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("summary", { count: customers.total })}</p>
        </div>
        <div className="shrink-0 [&>a]:min-h-11">
          <ExportCsvLink resource="customers" label={tAnalytics("exportCsv")} />
        </div>
      </header>

      {customers.items.length > 0 ? (
        <CustomersTable
          customers={customers.items}
          toolbar={toolbar}
          footer={<ListPager page={customers} />}
        />
      ) : (
        <DataTable toolbar={toolbar} className="bg-background">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon icon={isSearching ? SearchX : Users} size="md" aria-hidden />
            </span>
            <p className="text-body-b4 text-foreground">
              {isSearching ? t("noResultsTitle") : t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-md break-words text-body-b6 text-muted-foreground">
              {isSearching ? t("noResultsBody", { query }) : t("emptyBody")}
            </p>
          </div>
        </DataTable>
      )}
    </div>
  );
}
