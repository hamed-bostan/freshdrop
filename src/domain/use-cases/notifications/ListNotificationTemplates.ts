import type { NotificationTemplate } from "../../entities/NotificationTemplate";
import type { INotificationTemplateRepository } from "../../repositories/INotificationTemplateRepository";

export class ListNotificationTemplates {
  constructor(private readonly templateRepo: INotificationTemplateRepository) {}

  execute(): Promise<NotificationTemplate[]> {
    return this.templateRepo.list();
  }
}
