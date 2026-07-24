import { ADMIN_NOTIFICATION_PERMISSIONS, type AdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import { roleHasPermission } from "@/src/domain/entities/Permission";
import type { UserRole } from "@/src/domain/entities/User";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/**
 * Replace which categories this admin wants emailed. `categories` is narrowed
 * to ones the viewer's role could ever actually receive — re-checked here
 * rather than trusted from the client, the same discipline every other
 * write in this app applies, in case a role was demoted since the panel loaded.
 */
export class SetNotificationPreferences {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    role: UserRole,
    categories: readonly AdminNotificationAction[],
  ): Promise<AdminNotificationAction[]> {
    const allowed = categories.filter((category) => roleHasPermission(role, ADMIN_NOTIFICATION_PERMISSIONS[category]));
    await this.userRepository.setNotifiedCategories(userId, allowed);
    return allowed;
  }
}
