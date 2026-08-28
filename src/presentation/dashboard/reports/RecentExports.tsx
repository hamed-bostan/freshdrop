import { getTranslations } from "next-intl/server";

import { EXPORT_JOB_STATUSES } from "@/src/domain/entities/ExportJob";
import { Link } from "@/src/i18n/navigation";
import { buildExportJobQueryParams, parseExportJobQueryFilters } from "@/src/lib/api/export-job-params";
import { ListChoiceFilter, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";

import { exportJobsServerApi } from "./export-job-server-api";
import { ExportJobsPoller } from "./ExportJobsPoller";
import { ExportJobsTable } from "./ExportJobsTable";

/** How many rows the "recent" widget shows before pointing at the full list. */
const RECENT_PAGE_SIZE = 8;

type RecentExportsProps = { params: URLSearchParams };

/**
 * The Export center's "Recent exports" widget: the newest jobs, filterable by
 * search and status, with a link to the full paginated list
 * (`ExportJobsScreen`). Search and status write real query params on this
 * page's own URL (shared with the analytics range picker, different param
 * names), same as every other admin list.
 */
export async function RecentExports({ params }: RecentExportsProps) {
  const t = await getTranslations("dashExportReports");
  const filters = parseExportJobQueryFilters(params);

  const query = new URLSearchParams(buildExportJobQueryParams(filters));
  query.set("pageSize", String(RECENT_PAGE_SIZE));
  const jobs = await exportJobsServerApi.list(query);

  const hasProcessing = jobs.items.some((job) => job.status === "processing");
  const viewAllParams = buildExportJobQueryParams(filters);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-body-b1">{t("recentHeading")}</h2>
        <Link
          href={viewAllParams.size ? `/dashboard/reports/exports/jobs?${viewAllParams.toString()}` : "/dashboard/reports/exports/jobs"}
          className="text-body-b10 font-semibold text-primary hover:underline"
        >
          {t("recentViewAll")}
        </Link>
      </div>

      <div className="mt-2">
        <ListToolbar
          className="md:flex-row md:items-center [&>div:last-child]:w-full md:[&>div:last-child]:ms-auto md:[&>div:last-child]:w-auto"
          search={<ListSearchInput label={t("recentSearchLabel")} placeholder={t("recentSearchPlaceholder")} className="sm:max-w-none md:max-w-md" />}
          filters={
            <ListChoiceFilter
              paramName="status"
              label={t("recentFilterStatusLabel")}
              allLabel={t("recentFilterStatusAll")}
              showAllValue
              triggerClassName="w-full justify-between md:w-auto"
              options={EXPORT_JOB_STATUSES.map((status) => ({ value: status, label: t(`recentStatus.${status}`) }))}
            />
          }
        />
      </div>

      {jobs.items.length > 0 ? (
        <div className="mt-3">
          <ExportJobsTable jobs={jobs.items} />
        </div>
      ) : (
        <div className="mt-3 rounded-card-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-body-b8 text-muted-foreground">{t("recentEmpty")}</p>
        </div>
      )}

      <ExportJobsPoller active={hasProcessing} />
    </section>
  );
}
