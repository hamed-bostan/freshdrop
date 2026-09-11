import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/**
 * "Mark all read" — one user action spanning the feed's two sources:
 *  - the activity-log-derived half has no row of its own to flag, so it's a
 *    single timestamp column bumped to `at` (see `GetNotificationFeed`);
 *  - the stored notifications (see `AdminNotification`) each get their own
 *    `readAt`, bulk-set here rather than one write per row.
 */
export class MarkNotificationsSeen {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adminNotifications: IAdminNotificationRepository,
  ) {}

  async execute(viewerId: string, at: Date = new Date()): Promise<Date> {
    await Promise.all([
      this.userRepository.setLastSeenNotificationsAt(viewerId, at),
      this.adminNotifications.markAllRead(viewerId, at),
    ]);
    return at;
  }
}
