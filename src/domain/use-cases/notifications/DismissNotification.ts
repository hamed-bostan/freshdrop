import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";

/**
 * Dismiss one stored notification — the per-item counterpart to
 * `MarkNotificationsSeen`. Only meaningful for the stored half of the feed
 * (see `AdminNotification`); the activity-log-derived half has no row to
 * dismiss individually.
 */
export class DismissNotification {
  constructor(private readonly adminNotifications: IAdminNotificationRepository) {}

  async execute(id: string, viewerId: string): Promise<void> {
    await this.adminNotifications.markRead(id, viewerId);
  }
}
