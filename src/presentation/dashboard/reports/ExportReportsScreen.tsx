import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { Permission } from "@/src/domain/entities/Permission";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";

import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";

import { CustomExportBuilder } from "./CustomExportBuilder";
import { buildExportHref, EXPORT_REPORTS } from "./export-report-catalog";
import { RecentExports } from "./RecentExports";
import { ScheduledExportsPanel } from "./ScheduledExportsPanel";

type Props = {
  from: string;
  to: string;
  isCustomRange: boolean;
  permissions: readonly Permission[];
  /** This page's own query string — forwarded to `RecentExports` for its search/status filters. */
  params: URLSearchParams;
  /** Whether the builder may offer "email me a secure link" at all — the viewer has an email on file *and* SMTP is configured. */
  canEmailDeliver: boolean;
  /** Whether the viewer has an email on file, so the builder can explain *why* email delivery is unavailable when `canEmailDeliver` is false. */
  hasEmailOnFile: boolean;
};

export async function ExportReportsScreen({ from, to, isCustomRange, permissions, params, canEmailDeliver, hasEmailOnFile }: Props) {
  const t = await getTranslations("dashExportReports");
  const ta = await getTranslations("dashAnalytics");
  const reports = EXPORT_REPORTS.filter((report) => permissions.includes(report.permission));
  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-6">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports">{t("reports")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{t("heading")}</span>
      </nav>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-heading-h2 lg:text-heading-h1">{t("heading")}</h1>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AnalyticsRangePicker
          presetLabel={ta("rangeLabel")}
          presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]}
          fromLabel={ta("rangeFrom")}
          toLabel={ta("rangeTo")}
          from={from}
          to={to}
          isCustom={isCustomRange}
        />
      </header>
      <section>
        <h2 className="text-body-b1">{t("quickHeading")}</h2>
        <div className="scrollbar-hide -mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-2 md:px-0 xl:grid-cols-4">
          {reports.map((report, index) => (
            <article key={report.id} className="flex min-h-32 w-[76vw] min-w-72 max-w-sm shrink-0 snap-start items-center gap-3 rounded-card-lg border border-border bg-background p-4 md:w-auto md:min-w-0 md:max-w-none">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-card-md ${["bg-accent text-primary", "bg-info text-info-foreground", "bg-muted text-secondary", "bg-error text-destructive"][index]}`}
              >
                <Icon icon={report.icon} size="md" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-body-b8 font-semibold">{t(`report.${report.id}.name`)}</h3>
                <p className="mt-1 text-body-b10 text-muted-foreground">{t(`report.${report.id}.description`)}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 border-border px-4 text-foreground hover:border-primary hover:text-primary">
                <a href={buildExportHref(report, from, to)} download>{t("export")}</a>
              </Button>
            </article>
          ))}
        </div>
      </section>
      <CustomExportBuilder
        from={from}
        to={to}
        reports={reports.map((report) => ({ id: report.id, endpoint: report.endpoint, periodCapable: report.periodCapable }))}
        canEmailDeliver={canEmailDeliver}
        hasEmailOnFile={hasEmailOnFile}
      />
      {reports.length > 0 ? <ScheduledExportsPanel /> : null}
      {reports.length > 0 ? <RecentExports params={params} /> : null}
    </div>
  );
}
