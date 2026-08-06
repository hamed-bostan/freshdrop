import { csvRow } from "@/src/lib/csv";
import type { ReportDataset } from "./report-dataset";
import type { WrittenFile } from "./written-file";

/**
 * Render a dataset as CSV, buffered rather than streamed to the response —
 * unlike `csvStream`, this feeds `RunExportJob`'s upload to storage, not a
 * live download, so the whole file has to exist in memory before it can be
 * written to the bucket in one call regardless.
 *
 * A single-section dataset (every report today) is byte-for-byte what the
 * direct-download routes already produce: same BOM, same header, same rows.
 * A multi-section dataset (a future report with a real breakdown) gets a
 * blank line and a heading between tables, so the file stays one sheet's
 * worth of CSV rather than needing a reader that understands sections.
 */
export async function writeCsv(dataset: ReportDataset): Promise<WrittenFile> {
  const parts: string[] = [
    // UTF-8 BOM — see `csvStream` for why (Excel on Windows otherwise mangles
    // non-ASCII, which for this app means every Persian name).
    "﻿",
  ];
  let rowCount = 0;
  let first = true;
  for (const section of dataset.sections) {
    if (!first) parts.push("\r\n");
    first = false;
    if (dataset.sections.length > 1) parts.push(csvRow([section.heading]));
    parts.push(csvRow(section.header));
    for await (const row of section.rows) {
      parts.push(csvRow(row));
      rowCount += 1;
    }
  }

  return { data: Buffer.from(parts.join(""), "utf-8"), rowCount };
}
