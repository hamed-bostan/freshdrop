import { ADMIN_NOTIFICATION_PERMISSIONS, type AdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import { roleHasPermission } from "@/src/domain/entities/Permission";
import type { UserRole } from "@/src/domain/entities/User";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/** One category the preferences panel can offer, and whether the viewer has opted into email for it. */
export type NotificationPreference = {
  category: AdminNotificationAction;
  emailEnabled: boolean;
};

/**
 * The categories a viewer could ever be fanned into (see
 * `ADMIN_NOTIFICATION_PERMISSIONS`), each paired with whether they've opted
 * into email for it. A category their role can't receive is left off
 * entirely — a toggle with no effect is worse than no toggle.
 */
export class GetNotificationPreferences {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<NotificationPreference[]> {
    const user = await this.userRepository.getById(userId);
    if (!user) throw new NotFoundError("user", userId);

    return offeredCategories(user.role).map((category) => ({
      category,
      emailEnabled: user.notifiedCategories.includes(category),
    }));
  }
}

/** Every category whose gating permission this role holds. */
export function offeredCategories(role: UserRole): AdminNotificationAction[] {
  return (Object.keys(ADMIN_NOTIFICATION_PERMISSIONS) as AdminNotificationAction[]).filter((category) =>
    roleHasPermission(role, ADMIN_NOTIFICATION_PERMISSIONS[category]),
  );
}
