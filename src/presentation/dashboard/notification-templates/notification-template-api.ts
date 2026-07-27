import { apiPut } from "@/src/lib/api/client";
import type { NotificationTemplateKind } from "@/src/domain/entities/NotificationTemplate";
import type { NotificationTemplateFormInput } from "@/src/contracts/notification-template-schema";
import { notificationTemplateResponseSchema, type NotificationTemplateWire } from "./notification-template-response-schema";

/**
 * Typed client for saving one kind's notification copy. Sends the form's raw
 * (untrimmed) values — the route handler re-validates with the same
 * `notificationTemplateFormSchema(kind)` server-side.
 */
export const notificationTemplatesApi = {
  update(kind: NotificationTemplateKind, values: NotificationTemplateFormInput): Promise<NotificationTemplateWire> {
    return apiPut(`/admin/notification-templates/${kind}`, values, notificationTemplateResponseSchema);
  },
};
