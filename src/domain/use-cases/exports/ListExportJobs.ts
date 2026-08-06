import type { ExportJob, ExportJobFilters, ExportJobSort } from "@/src/domain/entities/ExportJob";
import type { Page, PageRequest } from "@/src/domain/entities/Pagination";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";

/** The Recent exports table's read — one page, scoped to reports the viewer may see. */
export class ListExportJobs {
  constructor(private readonly jobs: IExportJobRepository) {}

  execute(filters: ExportJobFilters, page: PageRequest<ExportJobSort>): Promise<Page<ExportJob>> {
    return this.jobs.listPage(filters, page);
  }
}
