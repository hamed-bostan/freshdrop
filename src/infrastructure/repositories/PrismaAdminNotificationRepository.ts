import type { AdminNotification, NewAdminNotification } from "@/src/domain/entities/AdminNotification";
import { toAdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * The bell's stored, per-admin notifications, backed by PostgreSQL via Prisma.
 * Server-side only (it opens a DB connection), bound through the container —
 * never imported by client code.
 */
export class PrismaAdminNotificationRepository implements IAdminNotificationRepository {
  async listForUser(userId: string, limit: number): Promise<AdminNotification[]> {
    const rows = await prisma.adminNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toAdminNotification);
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.adminNotification.count({ where: { userId, readAt: null } });
  }

  async create(input: NewAdminNotification): Promise<AdminNotification> {
    const row = await prisma.adminNotification.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
      },
    });
    return toAdminNotification(row);
  }

  async markRead(id: string, userId: string): Promise<void> {
    // `updateMany` rather than `update`: scoping the `where` to `userId` as well
    // as `id` is what makes this "dismiss my own row" rather than "dismiss any
    // row I can guess the id of" — and a row that doesn't match either (gone,
    // or someone else's) is a silent no-op, not an error worth surfacing for a
    // best-effort dismiss.
    await prisma.adminNotification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string, at: Date = new Date()): Promise<void> {
    await prisma.adminNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: at },
    });
  }
}

type AdminNotificationRow = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: Date;
  readAt: Date | null;
};

function toAdminNotification(row: AdminNotificationRow): AdminNotification {
  return {
    id: row.id,
    userId: row.userId,
    action: toAdminNotificationAction(row.action),
    entityType: row.entityType,
    entityId: row.entityId,
    entityLabel: row.entityLabel ?? undefined,
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? undefined,
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}
