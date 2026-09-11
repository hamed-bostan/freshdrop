import path from "node:path";

import PDFDocument from "pdfkit";

import type { ReportDataset } from "./report-dataset";
import type { WrittenFile } from "./written-file";

const FONT_DIR = path.join(process.cwd(), "src", "shared", "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "Vazirmatn-Regular.ttf");
const FONT_BOLD = path.join(FONT_DIR, "Vazirmatn-Bold.ttf");

const PAGE_MARGIN = 36;
const MIN_COLUMN_WIDTH = 46;
const ROW_PADDING = 4;
const MIN_FONT_SIZE = 6;
const BASE_FONT_SIZE = 9;

/**
 * Render a dataset as a PDF table, one table per section, landscape (admin
 * exports are wide) with the header row repeated on every page.
 *
 * Vazirmatn is embedded unconditionally — it covers Latin as well as Persian
 * glyphs, so one font serves both locales rather than switching families.
 * For a right-to-left locale, cell text is right-aligned; this does not
 * reorder mixed Latin/Persian runs within a cell (true bidi shaping), which
 * is an accepted simplification for a tabular export — see the Phase-plan
 * risk note on PDF being a summary format rather than a full data dump. A
 * report with many columns shrinks its font (down to `MIN_FONT_SIZE`) to
 * keep every column readable rather than truncating data silently.
 */
export async function writePdf(dataset: ReportDataset, options: { rtl?: boolean } = {}): Promise<WrittenFile> {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, layout: "landscape", size: "A4", bufferPages: true });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("body-bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<void>((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);
  });

  doc.font("body-bold").fontSize(16).text(dataset.title, { align: options.rtl ? "right" : "left" });
  if (dataset.period) {
    doc.font("body").fontSize(10).fillColor("#555555").text(dataset.period, { align: options.rtl ? "right" : "left" });
    doc.fillColor("#000000");
  }
  doc.moveDown();

  let rowCount = 0;
  let firstSection = true;
  for (const section of dataset.sections) {
    if (!firstSection) doc.addPage();
    firstSection = false;

    if (dataset.sections.length > 1) {
      doc.font("body-bold").fontSize(13).text(section.heading, { align: options.rtl ? "right" : "left" });
      doc.moveDown(0.5);
    }

    rowCount += await renderTable(doc, section.header, section.rows, options.rtl ?? false);
  }

  doc.end();
  await finished;

  return { data: Buffer.concat(chunks), rowCount };
}

/** Draw one section's table, paging and repeating the header as needed. Returns the row count drawn. */
async function renderTable(
  doc: PDFKit.PDFDocument,
  header: readonly string[],
  rows: AsyncIterable<readonly (string | number | boolean | Date | null | undefined)[]>,
  rtl: boolean,
): Promise<number> {
  const usableWidth = doc.page.width - PAGE_MARGIN * 2;
  const columnWidth = Math.max(MIN_COLUMN_WIDTH, usableWidth / header.length);
  const fontSize = columnWidth < 70 ? Math.max(MIN_FONT_SIZE, BASE_FONT_SIZE - (70 - columnWidth) / 10) : BASE_FONT_SIZE;

  const drawHeader = () => {
    const y = doc.y;
    doc.font("body-bold").fontSize(fontSize);
    header.forEach((title, index) => {
      doc.text(title, PAGE_MARGIN + index * columnWidth, y, {
        width: columnWidth,
        align: rtl ? "right" : "left",
      });
    });
    doc.moveDown(0.3);
    doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + usableWidth, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.2);
  };

  drawHeader();
  let count = 0;

  for await (const row of rows) {
    const rowHeight = fontSize + ROW_PADDING;
    if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      drawHeader();
    }

    const y = doc.y;
    doc.font("body").fontSize(fontSize);
    row.forEach((cell, index) => {
      doc.text(formatCell(cell), PAGE_MARGIN + index * columnWidth, y, {
        width: columnWidth,
        align: rtl ? "right" : "left",
      });
    });
    doc.y = y + rowHeight;
    count += 1;
  }

  return count;
}

function formatCell(value: string | number | boolean | Date | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
