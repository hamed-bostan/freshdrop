import { z } from "zod";
import {
  NOTIFICATION_TEMPLATE_CHANNEL,
  NOTIFICATION_TEMPLATE_VARS,
  type NotificationTemplateKind,
} from "@/src/domain/entities/NotificationTemplate";

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

/** Every `{{VAR}}` name referenced in `text`, deduplicated. */
function placeholdersIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]);
}

/**
 * The form/route body for saving one kind's copy, shared by the dashboard
 * editor and the route handler (defensive re-validation — never trust the
 * client). Built per-`kind` because the shape depends on it: push kinds
 * require `title` and leave `subject` empty, email kinds the reverse, and the
 * `{{VAR}}` allowlist a template may reference is different for every kind
 * (see `NOTIFICATION_TEMPLATE_VARS`) — a template can't reference a variable
 * that will never be filled at send time.
 */
export function notificationTemplateFormSchema(kind: NotificationTemplateKind) {
  const channel = NOTIFICATION_TEMPLATE_CHANNEL[kind];
  const allowlist = new Set(NOTIFICATION_TEMPLATE_VARS[kind]);

  function checkPlaceholders(value: string | undefined, field: "title" | "subject" | "body", ctx: z.RefinementCtx) {
    if (!value) return;
    for (const name of placeholdersIn(value)) {
      if (!allowlist.has(name)) {
        ctx.addIssue({ code: "custom", path: [field], message: `unknownVariable:${name}` });
      }
    }
  }

  return z
    .object({
      title: channel === "push" ? z.string().trim().min(1, "titleRequired") : z.string().trim().optional(),
      subject: channel === "email" ? z.string().trim().min(1, "subjectRequired") : z.string().trim().optional(),
      body: z.string().trim().min(1, "bodyRequired"),
    })
    .superRefine((data, ctx) => {
      checkPlaceholders(data.title, "title", ctx);
      checkPlaceholders(data.subject, "subject", ctx);
      checkPlaceholders(data.body, "body", ctx);
    });
}

export type NotificationTemplateFormInput = z.input<ReturnType<typeof notificationTemplateFormSchema>>;
export type NotificationTemplateFormValues = z.output<ReturnType<typeof notificationTemplateFormSchema>>;
