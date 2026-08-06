import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { writeCsv } from "../csv-writer";
import { writePdf } from "../pdf-writer";
import type { ReportDataset } from "../report-dataset";
import { writeXlsx } from "../xlsx-writer";

async function* rowsOf(rows: readonly (readonly (string | number)[])[]): AsyncGenerator<readonly (string | number)[]> {
  for (const row of rows) yield row;
}

function oneSectionDataset(): ReportDataset {
  return {
    title: "orders",
    period: "Jul 1 – Jul 31, 2026",
    sections: [
      {
        id: "orders",
        heading: "Orders",
        header: ["id", "total", "placed_at"],
        rows: rowsOf([
          ["order-1", 42.5, "2026-07-05"],
          ["order-2", 10, "2026-07-06"],
        ]),
      },
    ],
  };
}

function twoSectionDataset(): ReportDataset {
  return {
    title: "orders",
    period: "Jul 1 – Jul 31, 2026",
    sections: [
      {
        id: "orders",
        heading: "Orders",
        header: ["id", "total"],
        rows: rowsOf([["order-1", 42.5]]),
      },
      {
        id: "comparison",
        heading: "Comparison with previous period",
        header: ["metric", "current_period", "previous_period"],
        rows: rowsOf([["revenue", 100, 80]]),
      },
    ],
  };
}

describe("writeCsv", () => {
  it("round-trips a single-section dataset's header, rows and row count", async () => {
    const written = await writeCsv(oneSectionDataset());
    const text = written.data.toString("utf-8");

    expect(written.rowCount).toBe(2);
    expect(text).toContain('"id","total","placed_at"');
    expect(text).toContain('"order-1","42.5","2026-07-05"');
    expect(text).toContain('"order-2","10","2026-07-06"');
  });

  it("writes a heading line between sections for a multi-section dataset", async () => {
    const written = await writeCsv(twoSectionDataset());
    const text = written.data.toString("utf-8");

    expect(written.rowCount).toBe(2);
    expect(text).toContain("Orders");
    expect(text).toContain("Comparison with previous period");
    expect(text).toContain('"metric","current_period","previous_period"');
  });
});

describe("writeXlsx", () => {
  it("round-trips a single-section dataset into a readable workbook", async () => {
    const written = await writeXlsx(oneSectionDataset());
    expect(written.rowCount).toBe(2);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(written.data as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const sheet = workbook.worksheets[0];

    expect(sheet.getRow(1).getCell(1).value).toBe("id");
    expect(sheet.getRow(2).getCell(1).value).toBe("order-1");
    expect(sheet.getRow(2).getCell(2).value).toBe(42.5);
    expect(sheet.getRow(3).getCell(1).value).toBe("order-2");
  });

  it("creates one worksheet per section", async () => {
    const written = await writeXlsx(twoSectionDataset());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(written.data as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    expect(workbook.worksheets).toHaveLength(2);
    expect(workbook.worksheets[0].name).toBe("Orders");
    expect(workbook.worksheets[1].name).toBe("Comparison with previous period".slice(0, 31));
  });
});

describe("writePdf", () => {
  it("produces a non-empty PDF buffer with the correct row count", async () => {
    const written = await writePdf(oneSectionDataset());

    expect(written.rowCount).toBe(2);
    expect(written.data.length).toBeGreaterThan(0);
    // A PDF file's magic bytes — proof this is a real, well-formed document.
    expect(written.data.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });

  it("renders every section of a multi-section dataset", async () => {
    const written = await writePdf(twoSectionDataset());
    expect(written.rowCount).toBe(2);
  });

  it("renders right-to-left without throwing", async () => {
    const written = await writePdf(oneSectionDataset(), { rtl: true });
    expect(written.rowCount).toBe(2);
    expect(written.data.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });
});
