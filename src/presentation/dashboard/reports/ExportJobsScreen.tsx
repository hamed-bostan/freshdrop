import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EXPORT_JOB_STATUSES } from "@/src/domain/entities/ExportJob";
import type { ExportJob } from "@/src/domain/entities/ExportJob";
import type { Page } from "@/src/domain/entities/Pagination";
import { Link } from "@/src/i18n/navigation";
import { ListChoiceFilter, ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";

import { ExportJobsPoller } from "./ExportJobsPoller";
import { ExportJobsTable } from "./ExportJobsTable";

type ExportJobsScreenProps = {
  jobs: Page<ExportJob>;
  /** Whether the caller's query narrowed the list — distinguishes "no exports" from "no matches". */
  isFiltered: boolean;
};

/**
 * The Recent exports table's "View all": every job the viewer's permissions
 * cover, paged and filterable, rather than the Export center's fixed-size
 * recent widget (`RecentExports`). Both are backed by the same
 * `exportJobsServerApi.list` read and share `ExportJobsTable`, so a row looks
 * identical wherever it's shown.
 */
export async function ExportJobsScreen({ jobs, isFiltered }: ExportJobsScreenProps) {
  const t = await getTranslations("dashExportReports");
  const tList = await getTranslations("dashList");
  const hasProcessing = jobs.items.some((job) => job.status === "processing");

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports/exports">{t("heading")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{t("recentHeading")}</span>
      </nav>

      <header>
        <h1 className="text-heading-h2">{t("recentHeading")}</h1>
        <p className="mt-1 text-body-b10 text-muted-foreground">{t("recentSummary", { count: jobs.total })}</p>
      </header>

      <ListToolbar
        search={<ListSearchInput label={t("recentSearchLabel")} placeholder={t("recentSearchPlaceholder")} />}
        filters={
          <ListChoiceFilter
            paramName="status"
            label={t("recentFilterStatusLabel")}
            allLabel={t("recentFilterStatusAll")}
            showAllValue
            options={EXPORT_JOB_STATUSES.map((status) => ({ value: status, label: t(`recentStatus.${status}`) }))}
          />
        }
      />

      {jobs.items.length > 0 ? (
        <ExportJobsTable jobs={jobs.items} footer={<ListPager page={jobs} />} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">{isFiltered ? tList("noResultsTitle") : t("recentEmptyTitle")}</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{isFiltered ? tList("noResultsBody") : t("recentEmptyBody")}</p>
        </div>
      )}

      <ExportJobsPoller active={hasProcessing} />
    </div>
  );
}
