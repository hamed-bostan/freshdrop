import type { NotificationTemplate, NotificationTemplateKind } from "@/src/domain/entities/NotificationTemplate";
import type {
  INotificationTemplateRepository,
  NotificationTemplateInput,
} from "@/src/domain/repositories/INotificationTemplateRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Editable notification copy, backed by PostgreSQL via Prisma. All 12 rows
 * are seeded by the `add_notification_templates` migration — this repository
 * never creates a row lazily, unlike `PrismaTaxSettingsRepository`'s
 * singleton, because a missing row here means "fall back to the hardcoded
 * copy," not "create a default."
 */
export class PrismaNotificationTemplateRepository implements INotificationTemplateRepository {
  async get(kind: NotificationTemplateKind): Promise<NotificationTemplate | null> {
    const row = await prisma.notificationTemplate.findUnique({ where: { kind } });
    return row ? toTemplate(row) : null;
  }

  async list(): Promise<NotificationTemplate[]> {
    const rows = await prisma.notificationTemplate.findMany({ orderBy: { kind: "asc" } });
    return rows.map(toTemplate);
  }

  async update(kind: NotificationTemplateKind, input: NotificationTemplateInput): Promise<NotificationTemplate> {
    const row = await prisma.notificationTemplate.update({
      where: { kind },
      data: { title: input.title, subject: input.subject, body: input.body },
    });
    return toTemplate(row);
  }
}

function toTemplate(row: {
  kind: string;
  title: string | null;
  subject: string | null;
  body: string;
  updatedAt: Date;
}): NotificationTemplate {
  return {
    kind: row.kind as NotificationTemplateKind,
    title: row.title,
    subject: row.subject,
    body: row.body,
    updatedAt: row.updatedAt,
  };
}
