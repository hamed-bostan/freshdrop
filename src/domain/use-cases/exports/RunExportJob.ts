import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import type { DateRange } from "@/src/domain/entities/Analytics";
import type { ExportFormat, ExportJob } from "@/src/domain/entities/ExportJob";
import type { StockMovementFilters } from "@/src/domain/entities/StockMovement";
import type { IAnalyticsRepository } from "@/src/domain/repositories/IAnalyticsRepository";
import type { IEmailSender } from "@/src/domain/repositories/IEmailSender";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IStockMovementLog } from "@/src/domain/repositories/IStockMovementLog";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { writeCsv } from "@/src/lib/export-formats/csv-writer";
import { exportContentType, exportObjectPath } from "@/src/lib/export-formats/export-file-naming";
import { writePdf } from "@/src/lib/export-formats/pdf-writer";
import type { ReportDataset, ReportSection } from "@/src/lib/export-formats/report-dataset";
import type { WrittenFile } from "@/src/lib/export-formats/written-file";
import { writeXlsx } from "@/src/lib/export-formats/xlsx-writer";

import { buildCustomersDataset } from "./datasets/CustomersDataset";
import { buildInventoryDataset } from "./datasets/InventoryDataset";
import { buildOrdersDataset } from "./datasets/OrdersDataset";
import { buildProductsDataset } from "./datasets/ProductsDataset";
import { NotifyExportReady } from "./NotifyExportReady";

export type RunExportJobDeps = {
  jobs: IExportJobRepository;
  storage: IFileStorageRepository;
  orders: IOrderRepository;
  users: IUserRepository;
  products: IProductRepository;
  movements: IStockMovementLog;
  analytics: IAnalyticsRepository;
  emailSender: IEmailSender;
};

/**
 * Generate one export job's file and move it to its terminal state.
 *
 * The async half of the pipeline: `CreateExportJob` persists a `processing`
 * row and returns immediately; the route fires this without awaiting it, so
 * generation continues in the Node process after the response has gone back
 * to the browser (in-process, fire-and-forget — see the Export center plan's
 * "Generation" decision). A container restart mid-run strands the job at
 * `processing`; `SweepExportJobs` recovers it.
 *
 * A no-op (not an error) when the job is missing or already left
 * `processing` — a duplicate trigger, or a stale id, must not resurrect a
 * job that already reached `ready`/`failed`/`expired`.
 */
export class RunExportJob {
  constructor(private readonly deps: RunExportJobDeps) {}

  async execute(jobId: string): Promise<void> {
    const job = await this.deps.jobs.getById(jobId);
    if (job?.status !== "processing") return;

    try {
      const dataset = await this.buildDataset(job);
      const written = await writeFile(job.format, dataset);
      const path = exportObjectPath(job.id, job.reportId, job.format, job.createdAt);

      await this.deps.storage.upload({ path, data: written.data, contentType: exportContentType(job.format) });
      await this.deps.jobs.markReady(job.id, {
        rowCount: written.rowCount,
        byteSize: written.data.length,
        storagePath: path,
      });

      if (job.deliverTo) {
        await new NotifyExportReady(this.deps.storage, this.deps.emailSender).execute({
          deliverTo: job.deliverTo,
          reportId: job.reportId,
          format: job.format,
          storagePath: path,
          expiresAt: job.expiresAt,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export generation failed.";
      console.error(`[EXPORT_JOB_FAILED] ${job.id} (${job.reportId}/${job.format}):`, error);
      await this.deps.jobs.markFailed(job.id, message);
    }
  }

  private async buildDataset(job: ExportJob): Promise<ReportDataset> {
    const range = job.periodFrom && job.periodTo ? toInstantRange(job.periodFrom, job.periodTo) : null;
    const period = job.periodFrom && job.periodTo ? `${job.periodFrom} .. ${job.periodTo}` : null;

    let dataset: ReportDataset;
    switch (job.reportId) {
      case "orders": {
        const filters: AdminOrderFilters = range
          ? { placedFrom: range.from.toISOString(), placedTo: range.to.toISOString() }
          : {};
        dataset = buildOrdersDataset({ orders: this.deps.orders, users: this.deps.users }, filters, undefined, period);
        if (job.params.compareWithPrevious && range) {
          dataset = { ...dataset, sections: [...dataset.sections, await this.buildComparisonSection(range)] };
        }
        break;
      }
      case "inventory": {
        const filters: StockMovementFilters = range
          ? { occurredFrom: range.from.toISOString(), occurredTo: range.to.toISOString() }
          : {};
        dataset = buildInventoryDataset({ movements: this.deps.movements }, filters, undefined, undefined, period);
        break;
      }
      case "customers":
        dataset = buildCustomersDataset({ orders: this.deps.orders, users: this.deps.users }, {}, undefined);
        break;
      case "products":
        dataset = buildProductsDataset({ products: this.deps.products }, {}, undefined);
        break;
    }

    if (job.params.sections?.length) {
      const wanted = new Set(job.params.sections);
      dataset = { ...dataset, sections: dataset.sections.filter((section) => wanted.has(section.id)) };
    }

    return dataset;
  }

  /**
   * A same-length window immediately preceding the report's period, reusing
   * the exact aggregate (`IAnalyticsRepository.totals`) the analytics
   * overview's own "compare with previous period" reads — so a number here
   * reconciles with the dashboard rather than being a second definition of it.
   */
  private async buildComparisonSection(range: DateRange): Promise<ReportSection> {
    const lengthMs = range.to.getTime() - range.from.getTime();
    const previous: DateRange = { from: new Date(range.from.getTime() - lengthMs), to: range.from };
    const [current, prior] = await Promise.all([this.deps.analytics.totals(range), this.deps.analytics.totals(previous)]);

    async function* rows() {
      yield ["revenue", current.revenue, prior.revenue];
      yield ["orders", current.orders, prior.orders];
      yield ["units", current.units, prior.units];
      yield ["customers", current.customers, prior.customers];
      yield ["average_order_value", current.averageOrderValue, prior.averageOrderValue];
    }

    return {
      id: "comparison",
      heading: "Comparison with previous period",
      header: ["metric", "current_period", "previous_period"],
      rows: rows(),
    };
  }
}

function writeFile(format: ExportFormat, dataset: ReportDataset): Promise<WrittenFile> {
  switch (format) {
    case "csv":
      return writeCsv(dataset);
    case "xlsx":
      return writeXlsx(dataset);
    case "pdf":
      // Locale isn't tracked per job today, so PDFs render left-to-right
      // regardless of the requester's dashboard language — see the Export
      // center plan's PDF risk note.
      return writePdf(dataset, { rtl: false });
  }
}

/** `periodFrom`/`periodTo` are calendar dates (`YYYY-MM-DD`); `to` is exclusive, matching `nextCalendarDay`. */
function toInstantRange(from: string, to: string): DateRange {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
  return { from: fromDate, to: toDate };
}
