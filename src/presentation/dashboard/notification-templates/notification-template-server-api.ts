import { serverApiGet } from "@/src/lib/api/server-client";
import { notificationTemplateListResponseSchema, type NotificationTemplateWire } from "./notification-template-response-schema";

/** Server-side read of all 12 notification templates for the settings page (BFF). */
export const notificationTemplatesServerApi = {
  list(): Promise<NotificationTemplateWire[]> {
    return serverApiGet("/admin/notification-templates", notificationTemplateListResponseSchema);
  },
};
