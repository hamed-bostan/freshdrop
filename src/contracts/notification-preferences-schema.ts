import { z } from "zod";
import { ADMIN_NOTIFICATION_ACTIONS } from "@/src/domain/entities/AdminNotification";

/**
 * The body for setting which bell categories an admin also wants emailed,
 * shared by the client's preferences panel and the REST route handler
 * (defensive re-validation — never trust the client). The owner (userId) is
 * taken from the session server-side, so it never travels over the wire.
 */
export const notificationPreferencesSchema = z.object({
  categories: z.array(z.enum(ADMIN_NOTIFICATION_ACTIONS)),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
