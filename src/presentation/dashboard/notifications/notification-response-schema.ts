import { z } from "zod";

import { ADMIN_NOTIFICATION_ACTIONS } from "@/src/domain/entities/AdminNotification";
import { activityEntryResponseSchema } from "@/src/presentation/dashboard/activity/activity-response-schema";

/**
 * Wire shape of `GET /api/admin/notifications`.
 *
 * `activity` reuses the activity feature's own response schema rather than
 * inventing a parallel one: a notification-worthy entry is still an
 * `ActivityEntry`, and reusing the schema means the bell can reuse
 * `ActivityList`'s sentence-building (action → translated sentence,
 * `roleChangeKind` for role changes, `activityEntityHref` for the link)
 * instead of a second copy of it.
 *
 * `notifications` is the stored, per-admin half (see `AdminNotification`) —
 * the customer-initiated events the log structurally can't hold. Unlike
 * `activity`, each row carries its own `readAt`, so it can be dismissed one at
 * a time.
 */
const attentionCountsSchema = z.object({
  pendingReviews: z.number(),
  lowStock: z.number(),
  staleOrders: z.number(),
  staleOrdersCutoff: z.string(),
  overdueOrders: z.number(),
  overdueOrdersCutoff: z.string(),
});

const adminNotificationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.enum([...ADMIN_NOTIFICATION_ACTIONS, "unknown"]),
  entityType: z.string(),
  entityId: z.string(),
  entityLabel: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

export const notificationFeedResponseSchema = z.object({
  activity: z.array(activityEntryResponseSchema),
  /** How many of `activity`, in order, are newer than the viewer's last-seen instant. */
  unreadActivityCount: z.number(),
  notifications: z.array(adminNotificationResponseSchema),
  attention: attentionCountsSchema,
  /** The bell's badge total: `unreadActivityCount` plus unread `notifications`. */
  unreadCount: z.number(),
});

export const markNotificationsSeenResponseSchema = z.object({
  lastSeenNotificationsAt: z.string(),
});

export type NotificationAttentionCounts = z.infer<typeof attentionCountsSchema>;
export type AdminNotificationWire = z.infer<typeof adminNotificationResponseSchema>;
export type NotificationFeedResponse = z.infer<typeof notificationFeedResponseSchema>;
