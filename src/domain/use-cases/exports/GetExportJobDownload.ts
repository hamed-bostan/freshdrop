import { ExportNotReadyError } from "@/src/domain/errors/ExportNotReadyError";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";

/** How long a minted download link stays valid — short, since a fresh one is a click away. */
export const DOWNLOAD_LINK_TTL_SECONDS = 300;

/**
 * Turn a `ready` job into a time-limited download URL. Re-checks state on
 * every call rather than trusting the caller's last known status — a job can
 * expire between the Recent exports table rendering and someone clicking
 * Download.
 */
export class GetExportJobDownload {
  constructor(
    private readonly jobs: IExportJobRepository,
    private readonly storage: IFileStorageRepository,
  ) {}

  async execute(jobId: string): Promise<{ url: string; filename: string }> {
    const job = await this.jobs.getById(jobId);
    if (!job) throw new NotFoundError("export", jobId);

    if (job.status === "processing") {
      throw new ExportNotReadyError("processing", "This export is still generating. Check back in a moment.");
    }
    if (job.status === "failed") {
      throw new ExportNotReadyError("failed", "This export failed to generate. Regenerate it to try again.");
    }
    if (job.status === "expired" || job.expiresAt.getTime() <= Date.now() || !job.storagePath) {
      throw new ExportNotReadyError("expired", "This export's download link has expired. Regenerate it for a new one.");
    }

    const url = await this.storage.createSignedUrl(job.storagePath, DOWNLOAD_LINK_TTL_SECONDS);
    return { url, filename: job.storagePath.split("/").pop() ?? `${job.reportId}.${job.format}` };
  }
}
