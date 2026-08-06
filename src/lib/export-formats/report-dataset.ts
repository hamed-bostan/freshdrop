import type { CsvValue } from "@/src/lib/csv";

/**
 * One table within a report — what "Data sections" in the custom export
 * builder actually toggles. A section a caller doesn't select is simply never
 * built (its rows are never queried), which is what makes the checkbox real
 * rather than decorative.
 */
export type ReportSection = {
  /** Stable id, used by the builder's checkboxes and stored in `ExportJobParams.sections`. */
  id: string;
  /** Human-readable heading, written above the table in multi-section formats. */
  heading: string;
  header: readonly string[];
  rows: AsyncIterable<readonly CsvValue[]>;
};

/**
 * Everything a format writer needs to turn one report into a file. Shared by
 * every writer (`csv-writer.ts`, `xlsx-writer.ts`, `pdf-writer.ts`) and by
 * both the legacy direct-download routes and the job pipeline, so the four
 * reports' columns are defined exactly once — in
 * `src/domain/use-cases/exports/datasets/`.
 */
export type ReportDataset = {
  title: string;
  /** Formatted period, e.g. "Jul 2 – Aug 1, 2026" — null for snapshot-style reports (inventory, products). */
  period: string | null;
  sections: readonly ReportSection[];
};
