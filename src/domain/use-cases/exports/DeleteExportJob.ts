import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";

/**
 * The Recent exports table's overflow-menu "Delete" — removes a job's storage
 * object (when it has one) and its row. Unlike `SweepExportJobs`'s
 * time-based expiry, this runs on demand for any status: a `processing` row
 * has no object yet, a `failed` one never got one, and a `ready`/`expired`
 * one might.
 */
export class DeleteExportJob {
  constructor(
    private readonly jobs: IExportJobRepository,
    private readonly storage: IFileStorageRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const job = await this.jobs.getById(id);
    if (!job) throw new NotFoundError("export", id);

    if (job.storagePath) {
      // Best-effort, same reasoning as the sweep: a row that fails to delete
      // here can be deleted again, but an object orphaned by a row that's
      // already gone leaks forever.
      try {
        await this.storage.remove(job.storagePath);
      } catch (error) {
        console.error(`[EXPORT_JOB_DELETE] failed to remove storage object for job ${id}:`, error);
      }
    }

    await this.jobs.remove(id);
  }
}
