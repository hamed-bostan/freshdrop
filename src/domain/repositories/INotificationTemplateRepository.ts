import type { NotificationTemplate, NotificationTemplateKind } from "../entities/NotificationTemplate";

/** What the admin editor writes when it saves one kind's copy. */
export type NotificationTemplateInput = {
  title: string | null;
  subject: string | null;
  body: string;
};

export type INotificationTemplateRepository = {
  /** One kind's row, or `null` if it was never seeded/was deleted — callers fall back to the hardcoded copy. */
  get(kind: NotificationTemplateKind): Promise<NotificationTemplate | null>;
  /** All 12 rows, for the admin editor's list. */
  list(): Promise<NotificationTemplate[]>;
  update(kind: NotificationTemplateKind, input: NotificationTemplateInput): Promise<NotificationTemplate>;
};
