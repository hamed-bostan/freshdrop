import { apiGet, apiPatch, apiPut } from "@/src/lib/api/client";
import {
  markNotificationsSeenResponseSchema,
  notificationFeedResponseSchema,
  type NotificationFeedResponse,
} from "./notification-response-schema";

export const notificationsApi = {
  getFeed(): Promise<NotificationFeedResponse> {
    return apiGet("/admin/notifications", notificationFeedResponseSchema);
  },
  markSeen(): Promise<{ lastSeenNotificationsAt: string }> {
    return apiPut("/admin/notifications", undefined, markNotificationsSeenResponseSchema);
  },
  /** Dismiss one stored notification — the per-item counterpart to `markSeen`. */
  dismiss(id: string): Promise<void> {
    return apiPatch(`/admin/notifications/${id}`);
  },
};
