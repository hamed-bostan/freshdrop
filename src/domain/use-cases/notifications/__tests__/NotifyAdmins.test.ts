import { describe, expect, it } from "vitest";

import type { AdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import type { NotificationTemplate } from "@/src/domain/entities/NotificationTemplate";
import type { User } from "@/src/domain/entities/User";
import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import type { IEmailSender, EmailMessage } from "@/src/domain/repositories/IEmailSender";
import type { INotificationTemplateRepository } from "@/src/domain/repositories/INotificationTemplateRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

import { NotifyAdmins } from "../NotifyAdmins";

function recipient(overrides: Partial<User> = {}): User {
  return {
    id: "admin-1",
    phone: "09120000000",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    notifiedCategories: ["order.placed", "order.returnRequested", "review.submitted", "product.stockDepleted"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function userRepo(): IUserRepository {
  return {
    listByRoles: async () => [recipient()],
  } as unknown as IUserRepository;
}

function adminNotifications(): IAdminNotificationRepository {
  return { create: async () => {} } as unknown as IAdminNotificationRepository;
}

function emailSenderSpy(): { sender: IEmailSender; sent: EmailMessage[] } {
  const sent: EmailMessage[] = [];
  return { sender: { send: async (message: EmailMessage) => void sent.push(message) }, sent };
}

const noTemplates: INotificationTemplateRepository = {
  get: async () => null,
  list: async () => [],
  update: async () => {
    throw new Error("not used in this test");
  },
};

function seededTemplates(): INotificationTemplateRepository {
  const rows: Record<string, NotificationTemplate> = {
    "order.placed": row(
      "order.placed",
      "New order placed",
      "A new order was placed: {{LABEL}}.\n\nOpen it from the dashboard's Orders list.",
    ),
    "order.returnRequested": row(
      "order.returnRequested",
      "Return requested",
      "A customer requested a return on order {{LABEL}}.\n\nApprove or reject it from the dashboard's Orders list.",
    ),
    "review.submitted": row(
      "review.submitted",
      "New review awaiting moderation",
      "A new review was submitted and is awaiting moderation.\n\nReview it from the dashboard's Reviews queue.",
    ),
    "product.stockDepleted": row(
      "product.stockDepleted",
      "Product out of stock",
      "{{LABEL}} just ran out of stock.\n\nRestock it from the dashboard's Products list.",
    ),
  };
  return {
    get: async (kind) => rows[kind] ?? null,
    list: async () => Object.values(rows),
    update: async () => {
      throw new Error("not used in this test");
    },
  };
}

function row(kind: AdminNotificationAction, subject: string, body: string): NotificationTemplate {
  return { kind, title: null, subject, body, updatedAt: new Date() };
}

const ACTIONS: { action: AdminNotificationAction; permission: "orders.fulfill" | "reviews.moderate" | "catalog.write" }[] = [
  { action: "order.placed", permission: "orders.fulfill" },
  { action: "order.returnRequested", permission: "orders.fulfill" },
  { action: "review.submitted", permission: "reviews.moderate" },
  { action: "product.stockDepleted", permission: "catalog.write" },
];

describe("NotifyAdmins — phase 2 fallback guarantee", () => {
  it.each(ACTIONS)("$action: emails byte-identical subject/text whether the seeded row exists or not", async ({ action, permission }) => {
    const before = emailSenderSpy();
    await new NotifyAdmins(userRepo(), adminNotifications(), before.sender, noTemplates).execute(permission, {
      action,
      entityType: "order",
      entityId: "order-1",
      entityLabel: "AB12CD",
    });

    const after = emailSenderSpy();
    await new NotifyAdmins(userRepo(), adminNotifications(), after.sender, seededTemplates()).execute(permission, {
      action,
      entityType: "order",
      entityId: "order-1",
      entityLabel: "AB12CD",
    });

    expect(after.sent).toEqual(before.sent);
    expect(before.sent).toHaveLength(1);
  });
});
