import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import type { Locale } from "@/src/i18n/routing";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { Badge, DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";
import { EXPORT_FORMAT_LABEL, getExportReport } from "./export-report-catalog";
import { ScheduledExportActiveToggle } from "./ScheduledExportActiveToggle";
import { ScheduledExportRowActions } from "./ScheduledExportRowActions";

type Props = {
  schedules: ScheduledExport[];
  /** Row actions (edit/delete) only render on the full management list — the compact panel is read-mostly plus the Active toggle. */
  showActions?: boolean;
  footer?: ReactNode;
};

/**
 * The Scheduled reports table — shared between the Export center's compact
 * panel and the full `/schedules` management list, so a row reads the same
 * wherever it's shown (mirrors `ExportJobsTable`).
 */
export async function ScheduledExportsTable({ schedules, showActions = false, footer }: Props) {
  const t = await getTranslations("dashScheduledExports");
  const te = await getTranslations("dashExportReports");
  const locale = (await getLocale()) as Locale;

  return (
    <DataTable minWidthClassName="min-w-[52rem]" footer={footer}>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colReport")}</TableHead>
            <TableHead>{t("colSchedule")}</TableHead>
            <TableHead>{t("colFormat")}</TableHead>
            <TableHead>{t("colDelivery")}</TableHead>
            <TableHead>{t("colNextRun")}</TableHead>
            <TableHead>{t("colLastRun")}</TableHead>
            <TableHead className="text-end">{t("colActive")}</TableHead>
            {showActions && (
              <TableHead className="text-end">
                <span className="sr-only">{t("colActions")}</span>
              </TableHead>
            )}
          </tr>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const report = getExportReport(schedule.reportId);
            return (
              <TableRow key={schedule.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary">
                      <Icon icon={report.icon} size="xs" />
                    </span>
                    <span className="whitespace-nowrap text-body-b10 font-medium">{te(`report.${schedule.reportId}.name`)}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10">{scheduleTimingLabel(schedule, t)}</TableCell>
                <TableCell className="whitespace-nowrap text-body-b10">{EXPORT_FORMAT_LABEL[schedule.format]}</TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {schedule.deliverTo ?? t("downloadOnly")}
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {schedule.active ? (
                    `${formatOrderDateShort(schedule.nextRunAt.toISOString(), locale)} · ${formatOrderTime(schedule.nextRunAt.toISOString(), locale)}`
                  ) : (
                    <Badge variant="neutral">{t("paused")}</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {schedule.lastRunAt
                    ? `${formatOrderDateShort(schedule.lastRunAt.toISOString(), locale)} · ${formatOrderTime(schedule.lastRunAt.toISOString(), locale)}`
                    : t("neverRun")}
                </TableCell>
                <TableCell className="text-end">
                  <ScheduledExportActiveToggle id={schedule.id} active={schedule.active} />
                </TableCell>
                {showActions && (
                  <TableCell className="text-end">
                    <ScheduledExportRowActions id={schedule.id} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}

/**
 * "Weekly · Monday · 06:00 (Asia/Tehran)" — built straight from the
 * schedule's own timing fields rather than reformatting `nextRunAt`, so it's
 * the exact wall-clock time an admin configured, not a UTC reprojection of it.
 */
/** `weekday.0`..`weekday.6` as a literal tuple — see `ScheduledExportForm`'s copy of this for why. */
const WEEKDAY_KEYS = ["weekday.0", "weekday.1", "weekday.2", "weekday.3", "weekday.4", "weekday.5", "weekday.6"] as const;

function scheduleTimingLabel(schedule: ScheduledExport, t: Awaited<ReturnType<typeof getTranslations<"dashScheduledExports">>>): string {
  const hour = `${String(schedule.hour).padStart(2, "0")}:00`;
  const cadenceKey = schedule.cadence === "weekly" ? ("cadenceWeekly" as const) : ("cadenceMonthly" as const);
  const cadenceLabel = schedule.cadence === "weekly" ? t(WEEKDAY_KEYS[schedule.dayOfWeek ?? 0]) : t("dayOfMonthValue", { day: schedule.dayOfMonth ?? 1 });
  return `${t(cadenceKey)} · ${cadenceLabel} · ${hour} (${schedule.timezone})`;
}
