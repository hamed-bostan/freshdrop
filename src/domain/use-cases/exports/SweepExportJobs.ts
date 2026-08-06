import { EXPORT_JOB_STRANDED_MINUTES } from "@/src/domain/entities/ExportJob";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";

export type SweepResult = {
  expired: number;
  strandedRecovered: number;
};

/**
 * The export center's daily housekeeping pass — two independent jobs sharing
 * one endpoint (`POST /api/admin/exports/sweep`) because they run on the same
 * cadence and neither depends on the other:
 *
 *  - **Expiry**: `ready` jobs past `expiresAt` are swept to `expired` and
 *    their storage object removed, so the bucket doesn't grow unbounded and
 *    the reference's "download links expire after 7 days" is actually true.
 *  - **Stranded recovery**: `processing` jobs older than
 *    `EXPORT_JOB_STRANDED_MINUTES` are marked `failed`. Generation is
 *    in-process and fire-and-forget (`RunExportJob`), so a container restart
 *    mid-run otherwise leaves the row "processing" forever — this is what
 *    makes that status trustworthy again.
 */
export class SweepExportJobs {
  constructor(
    private readonly jobs: IExportJobRepository,
    private readonly storage: IFileStorageRepository,
  ) {}

  async execute(now: Date = new Date()): Promise<SweepResult> {
    const expiring = await this.jobs.listExpiring(now);
    for (const job of expiring) {
      if (job.storagePath) {
        // Best-effort: an object that fails to delete just gets swept again
        // the object is gone but the row didn't get marked, versus a row
        // marked `expired` whose object leaks forever.
        try {
          await this.storage.remove(job.storagePath);
        } catch (error) {
          console.error(`[EXPORT_SWEEP] failed to remove storage object for job ${job.id}:`, error);
        }
      }
    }
    if (expiring.length) {
      await this.jobs.markExpired(expiring.map((job) => job.id));
    }

    const strandedBefore = new Date(now.getTime() - EXPORT_JOB_STRANDED_MINUTES * 60 * 1000);
    const stranded = await this.jobs.listStranded(strandedBefore);
    for (const job of stranded) {
      await this.jobs.markFailed(job.id, "Generation did not complete (the server restarted mid-run).");
    }

    return { expired: expiring.length, strandedRecovered: stranded.length };
  }
}
