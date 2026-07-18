import type { RoleChange } from "@/src/domain/entities/RoleChange";
import { toUserRole } from "@/src/domain/entities/User";
import type { IRoleChangeLog, NewRoleChange } from "@/src/domain/repositories/IRoleChangeLog";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Role change history backed by PostgreSQL via Prisma. Server-side only (it opens
 * a DB connection), bound through the container — never imported by client code.
 *
 * Append-only by construction: there is no update or delete here, and nothing
 * else writes the table.
 */
export class PrismaRoleChangeLog implements IRoleChangeLog {
  async record(entry: NewRoleChange): Promise<void> {
    await prisma.roleChange.create({
      data: {
        userId: entry.userId,
        userName: entry.userName,
        actorId: entry.actorId,
        actorName: entry.actorName,
        fromRole: entry.fromRole,
        toRole: entry.toRole,
      },
    });
  }

  async list(limit: number): Promise<RoleChange[]> {
    const rows = await prisma.roleChange.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toRoleChange);
  }
}

/** Map a Prisma row to the domain entity, narrowing the stored role strings. */
function toRoleChange(row: {
  id: string;
  userId: string;
  userName: string;
  actorId: string;
  actorName: string;
  fromRole: string;
  toRole: string;
  createdAt: Date;
}): RoleChange {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    actorId: row.actorId,
    actorName: row.actorName,
    // The columns are plain strings (the schema is enum-free), so narrow here
    // rather than trusting the database to hold only known values.
    fromRole: toUserRole(row.fromRole),
    toRole: toUserRole(row.toRole),
    at: row.createdAt,
  };
}
