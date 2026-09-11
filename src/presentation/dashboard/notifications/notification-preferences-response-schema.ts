import { z } from "zod";

import { ADMIN_NOTIFICATION_ACTIONS } from "@/src/domain/entities/AdminNotification";

/** One category the preferences panel can offer, paired with whether the viewer has opted into email for it. */
const notificationPreferenceSchema = z.object({
  category: z.enum(ADMIN_NOTIFICATION_ACTIONS),
  emailEnabled: z.boolean(),
});

export const notificationPreferencesResponseSchema = z.object({
  preferences: z.array(notificationPreferenceSchema),
});

export const setNotificationPreferencesResponseSchema = z.object({
  categories: z.array(z.enum(ADMIN_NOTIFICATION_ACTIONS)),
});

export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
