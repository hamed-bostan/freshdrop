import { PassThrough } from "node:stream";
import ExcelJS from "exceljs";
import type { ReportDataset } from "./report-dataset";
import type { WrittenFile } from "./written-file";

/**
 * Render a dataset as an `.xlsx` workbook, one worksheet per section.
 *
 * Uses exceljs's streaming `WorkbookWriter` (rows are committed as they're
 * consumed from the section's `AsyncIterable`, not held all at once) piped
 * into an in-memory `PassThrough`, so peak memory during generation stays
 * proportional to one row rather than the whole sheet — the same guarantee
 * `csvStream` gives the direct-download routes — while still handing
 * `RunExportJob` a single `Buffer` to upload, since the destination is
 * object storage, not a live HTTP response.
 */
export async function writeXlsx(dataset: ReportDataset): Promise<WrittenFile> {
  const sink = new PassThrough();
  const chunks: Buffer[] = [];
  sink.on("data", (chunk: Buffer) => chunks.push(chunk));
  const collected = new Promise<void>((resolve, reject) => {
    sink.on("end", resolve);
    sink.on("error", reject);
  });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: sink, useStyles: true });
  let rowCount = 0;

  for (const section of dataset.sections) {
    // Excel sheet names are capped at 31 characters and can't repeat.
    const worksheet = workbook.addWorksheet(section.heading.slice(0, 31) || section.id);

    const headerRow = worksheet.addRow([...section.header]);
    headerRow.font = { bold: true };
    headerRow.commit();

    for await (const row of section.rows) {
      worksheet.addRow([...row]).commit();
      rowCount += 1;
    }

    worksheet.commit();
  }

  await workbook.commit();
  sink.end();
  await collected;

  return { data: Buffer.concat(chunks), rowCount };
}
