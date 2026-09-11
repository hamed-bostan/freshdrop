import { NOTIFICATION_TEMPLATE_KINDS, type NotificationTemplate, type NotificationTemplateKind } from "../../entities/NotificationTemplate";
import { NotFoundError } from "../../errors/NotFoundError";

import type { INotificationTemplateRepository, NotificationTemplateInput } from "../../repositories/INotificationTemplateRepository";

export class UpdateNotificationTemplate {
  constructor(private readonly templateRepo: INotificationTemplateRepository) {}

  execute(kind: string, input: NotificationTemplateInput): Promise<NotificationTemplate> {
    if (!isNotificationTemplateKind(kind)) throw new NotFoundError("notification template", kind);

    return this.templateRepo.update(kind, {
      title: input.title?.trim() ? input.title.trim() : null,
      subject: input.subject?.trim() ? input.subject.trim() : null,
      body: input.body.trim(),
    });
  }
}

function isNotificationTemplateKind(value: string): value is NotificationTemplateKind {
  return (NOTIFICATION_TEMPLATE_KINDS as readonly string[]).includes(value);
}
