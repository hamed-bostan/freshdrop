import { ChevronRight, Download } from "lucide-react";
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
          <h1 className="dashboard-page-title">{t("heading")}</h1>
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
      <section className="space-y-4">
        <h2 className="text-body-b1">{t("quickHeading")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reports.map((report) => (
            <article key={report.id} className="flex min-w-0 flex-col rounded-card-lg border border-border bg-background p-5 transition-colors hover:border-primary/40">
              <span
                className="mb-4 flex size-10 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary"
              >
                <Icon icon={report.icon} size="md" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-body-b8 font-semibold">{t(`report.${report.id}.name`)}</h3>
                <p className="mt-2 text-body-b10 leading-relaxed text-muted-foreground">{t(`report.${report.id}.description`)}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-5 w-full border-border text-foreground hover:border-primary hover:text-primary">
                <a href={buildExportHref(report, from, to)} download aria-label={`${t("export")} ${t(`report.${report.id}.name`)}`}><Download className="size-4" aria-hidden="true" />{t("export")}</a>
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
