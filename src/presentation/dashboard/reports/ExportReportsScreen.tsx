import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { Permission } from "@/src/domain/entities/Permission";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";
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
};

export async function ExportReportsScreen({ from, to, isCustomRange, permissions, params }: Props) {
  const t = await getTranslations("dashExportReports");
  const ta = await getTranslations("dashAnalytics");
  const reports = EXPORT_REPORTS.filter((report) => permissions.includes(report.permission));
  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports">{t("reports")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{t("heading")}</span>
      </nav>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2">{t("heading")}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("subtitle")}</p>
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
        <h2 className="text-body-b7">{t("quickHeading")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {reports.map((report, index) => (
            <article key={report.id} className="flex items-center gap-3 rounded-card-lg border border-border bg-background p-4">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-card-md ${["bg-accent text-primary", "bg-info text-info-foreground", "bg-muted text-secondary", "bg-error text-destructive"][index]}`}
              >
                <Icon icon={report.icon} size="md" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-body-b8 font-semibold">{t(`report.${report.id}.name`)}</h3>
                <p className="mt-1 text-body-b10 text-muted-foreground">{t(`report.${report.id}.description`)}</p>
              </div>
              <a href={buildExportHref(report, from, to)} download className="shrink-0 rounded-input border border-border px-4 py-2 text-body-b10 font-semibold">
                {t("export")}
              </a>
            </article>
          ))}
        </div>
      </section>
      <CustomExportBuilder
        from={from}
        to={to}
        reports={reports.map((report) => ({ id: report.id, endpoint: report.endpoint, periodCapable: report.periodCapable }))}
      />
      {reports.length > 0 ? <ScheduledExportsPanel /> : null}
      {reports.length > 0 ? <RecentExports params={params} /> : null}
    </div>
  );
}
