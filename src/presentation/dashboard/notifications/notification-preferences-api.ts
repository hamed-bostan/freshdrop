import type { AdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import { apiGet, apiPut } from "@/src/lib/api/client";
import {
  notificationPreferencesResponseSchema,
  setNotificationPreferencesResponseSchema,
  type NotificationPreference,
} from "./notification-preferences-response-schema";

export const notificationPreferencesApi = {
  list(): Promise<NotificationPreference[]> {
    return apiGet("/admin/notification-preferences", notificationPreferencesResponseSchema).then(
      (response) => response.preferences,
    );
  },
  set(categories: readonly AdminNotificationAction[]): Promise<AdminNotificationAction[]> {
    return apiPut(
      "/admin/notification-preferences",
      { categories },
      setNotificationPreferencesResponseSchema,
    ).then((response) => response.categories);
  },
};
