import { getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Page } from "@/src/domain/entities/Pagination";
import { ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
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
  const isSearching = query != null && query.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count: customers.total })}</p>
      </div>

      <ListToolbar
        search={<ListSearchInput label={t("searchPlaceholder")} placeholder={t("searchPlaceholder")} />}
        // Carries the current search, so an export is the rows on screen. This file
        // holds names and phone numbers — see the endpoint's own note.
        filters={<ExportCsvLink resource="customers" label={tAnalytics("exportCsv")} />}
      />

      {customers.items.length > 0 ? (
        <CustomersTable
          customers={customers.items}
          footer={<ListPager page={customers} />}
        />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isSearching ? t("noResultsTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isSearching ? t("noResultsBody", { query }) : t("emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
