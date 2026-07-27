import { z } from "zod";
import { NOTIFICATION_TEMPLATE_KINDS } from "@/src/domain/entities/NotificationTemplate";

/** The wire shape of `NotificationTemplate` — dates travel as ISO strings over JSON. */
export const notificationTemplateResponseSchema = z.object({
  kind: z.enum(NOTIFICATION_TEMPLATE_KINDS),
  title: z.string().nullable(),
  subject: z.string().nullable(),
  body: z.string(),
  updatedAt: z.coerce.date(),
});

export const notificationTemplateListResponseSchema = z.array(notificationTemplateResponseSchema);

export type NotificationTemplateWire = z.infer<typeof notificationTemplateResponseSchema>;
