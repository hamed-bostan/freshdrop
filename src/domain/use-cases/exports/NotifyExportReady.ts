import type { ExportFormat, ExportJobReportId } from "@/src/domain/entities/ExportJob";
import type { IEmailSender } from "@/src/domain/repositories/IEmailSender";
import type { IFileStorageRepository } from "@/src/domain/repositories/IFileStorageRepository";

export type ExportReadyNotification = {
  deliverTo: string;
  reportId: ExportJobReportId;
  format: ExportFormat;
  storagePath: string;
  /** The job's own expiry — the emailed link is signed for exactly as long as the job stays downloadable. */
  expiresAt: Date;
};

/** Never sign a link for less than this, even for a job that's about to expire. */
const MIN_LINK_TTL_SECONDS = 60;

/**
 * Email the requester a secure link once their export is ready — the
 * "Email me a secure link" delivery option, and a due schedule's
 * `deliverTo`. Fired from `RunExportJob` right after `markReady`.
 *
 * Best-effort by construction, not just because `IEmailSender.send` already
 * is: minting the signed URL can itself fail, and a storage hiccup here must
 * not turn an otherwise-successful export into a `failed` job — the file is
 * generated and sitting in the Recent exports table either way, so the worst
 * outcome is that the requester has to click "Download" there instead of in
 * their inbox.
 */
export class NotifyExportReady {
  constructor(
    private readonly storage: IFileStorageRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(notification: ExportReadyNotification): Promise<void> {
    try {
      const ttlSeconds = Math.max(MIN_LINK_TTL_SECONDS, Math.floor((notification.expiresAt.getTime() - Date.now()) / 1000));
      const url = await this.storage.createSignedUrl(notification.storagePath, ttlSeconds);
      const filename = notification.storagePath.split("/").pop() ?? `${notification.reportId}.${notification.format}`;

      await this.emailSender.send({
        to: notification.deliverTo,
        subject: `Your ${notification.reportId} export is ready`,
        text: [
          `Your ${notification.reportId} export (${notification.format.toUpperCase()}) has finished generating.`,
          "",
          `Download it here: ${url}`,
          "",
          `File: ${filename}`,
          `This link expires on ${notification.expiresAt.toUTCString()}.`,
        ].join("\n"),
      });
    } catch (error) {
      console.error(`[EXPORT_NOTIFY_FAILED] ${notification.storagePath}:`, error);
    }
  }
}
