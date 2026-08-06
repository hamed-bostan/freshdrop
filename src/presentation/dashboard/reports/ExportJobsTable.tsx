import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { ExportJob, ExportJobStatus } from "@/src/domain/entities/ExportJob";
import type { Locale } from "@/src/i18n/routing";
import { formatOrderDateShort } from "@/src/lib/formatOrderDate";
import { Badge, DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/presentation/design-system";
import { EXPORT_FORMAT_LABEL, getExportReport } from "./export-report-catalog";
import { ExportJobRowActions } from "./ExportJobRowActions";

type ExportJobsTableProps = {
  jobs: ExportJob[];
  /** Pagination or a "View all" link attached to the shared table frame. */
  footer?: ReactNode;
};

const STATUS_VARIANT: Record<ExportJobStatus, "info" | "success" | "error" | "neutral"> = {
  processing: "info",
  ready: "success",
  failed: "error",
  expired: "neutral",
};

/**
 * The Recent exports table — shared between the Export center's "recent"
 * widget and the full "View all" page (`ExportJobsScreen`), so the two never
 * drift in what a row shows.
 *
 * Server-rendered; only the per-row menu (`ExportJobRowActions`) is a client
 * island, same split as `OrdersTable`/`OrderRowActions`.
 */
export async function ExportJobsTable({ jobs, footer }: ExportJobsTableProps) {
  const t = await getTranslations("dashExportReports");
  const locale = (await getLocale()) as Locale;

  return (
    <DataTable minWidthClassName="min-w-[56rem]" footer={footer}>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("recentColReport")}</TableHead>
            <TableHead>{t("recentColRequestedBy")}</TableHead>
            <TableHead>{t("recentColFormat")}</TableHead>
            <TableHead>{t("recentColPeriod")}</TableHead>
            <TableHead>{t("recentColCreated")}</TableHead>
            <TableHead>{t("recentColStatus")}</TableHead>
            <TableHead>{t("recentColExpires")}</TableHead>
            <TableHead className="text-end">
              <span className="sr-only">{t("recentColActions")}</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const report = getExportReport(job.reportId);
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary">
                      <Icon icon={report.icon} size="xs" />
                    </span>
                    <span className="whitespace-nowrap text-body-b10 font-medium">{t(`report.${job.reportId}.name`)}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10">{job.requestedByName}</TableCell>
                <TableCell className="whitespace-nowrap text-body-b10">{EXPORT_FORMAT_LABEL[job.format]}</TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {job.periodFrom && job.periodTo
                    ? `${formatOrderDateShort(job.periodFrom, locale)} – ${formatOrderDateShort(job.periodTo, locale)}`
                    : t("recentAsOf", { date: formatOrderDateShort(job.createdAt.toISOString(), locale) })}
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {formatOrderDateShort(job.createdAt.toISOString(), locale)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[job.status]}>{t(`recentStatus.${job.status}`)}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-body-b10 text-muted-foreground">
                  {job.status === "ready" ? formatOrderDateShort(job.expiresAt.toISOString(), locale) : "—"}
                </TableCell>
                <TableCell className="text-end">
                  <ExportJobRowActions job={job} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
