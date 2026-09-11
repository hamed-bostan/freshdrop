import type { ExportFormat, ExportJobReportId } from "@/src/domain/entities/ExportJob";

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  csv: "csv",
  xlsx: "xlsx",
  pdf: "pdf",
};

const CONTENT_TYPE_BY_FORMAT: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

export function exportContentType(format: ExportFormat): string {
  return CONTENT_TYPE_BY_FORMAT[format];
}

/** `<jobId>/<reportId>-<date>.<ext>` — the object path a generated file is uploaded to. */
export function exportObjectPath(jobId: string, reportId: ExportJobReportId, format: ExportFormat, at: Date): string {
  const stamp = at.toISOString().slice(0, 10);
  return `${jobId}/${reportId}-${stamp}.${EXTENSION_BY_FORMAT[format]}`;
}

/** The filename offered on download — same stem, no job id (that's an implementation detail, not something to hand the browser). */
export function exportDownloadFilename(reportId: ExportJobReportId, format: ExportFormat, at: Date): string {
  const stamp = at.toISOString().slice(0, 10);
  return `${reportId}-${stamp}.${EXTENSION_BY_FORMAT[format]}`;
}
