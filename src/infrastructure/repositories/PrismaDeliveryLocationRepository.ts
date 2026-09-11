import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type {
  IDeliveryLocationRepository,
  NewDeliveryLocation,
} from "@/src/domain/repositories/IDeliveryLocationRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * A user's saved delivery addresses backed by PostgreSQL via Prisma. Per-user data,
 * scoped by `userId`. Server-side only (it opens a DB connection), bound through the
 * container — never imported by client code.
 */
export class PrismaDeliveryLocationRepository implements IDeliveryLocationRepository {
  async getByUser(userId: string): Promise<DeliveryLocation[]> {
    // Oldest first — the address list reads in the order the user saved them.
    const rows = await prisma.deliveryLocation.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDeliveryLocation);
  }

  async getById(userId: string, id: string): Promise<DeliveryLocation | null> {
    // Scoped to the owner: another user's id simply doesn't match, so it reads as
    // "not found" rather than leaking that the row exists.
    const row = await prisma.deliveryLocation.findFirst({ where: { id, userId } });
    return row ? toDeliveryLocation(row) : null;
  }

  async create(userId: string, input: NewDeliveryLocation): Promise<DeliveryLocation> {
    // The user's first saved address becomes their checkout default, so there's
    // always something selected. Counting + inserting in one transaction keeps two
    // concurrent "first" inserts from both claiming the default (the partial unique
    // index would reject the second anyway; this avoids the error).
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.deliveryLocation.count({ where: { userId } });
      return tx.deliveryLocation.create({
        data: {
          userId,
          label: input.label,
          address: input.address,
          city: input.city ?? null,
          kind: input.kind,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          isDefault: existing === 0,
        },
      });
    });
    return toDeliveryLocation(row);
  }

  async setDefault(userId: string, id: string): Promise<DeliveryLocation> {
    // Clear the current default before setting the new one — the partial unique
    // index allows only one default per user and Postgres checks it per statement,
    // so the order matters. Ownership is re-checked here (defence behind the
    // use-case) so a mismatched userId can never move another user's default.
    const row = await prisma.$transaction(async (tx) => {
      const target = await tx.deliveryLocation.findFirst({ where: { id, userId } });
      if (!target) throw new NotFoundError("address", id);

      await tx.deliveryLocation.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.deliveryLocation.update({ where: { id }, data: { isDefault: true } });
    });
    return toDeliveryLocation(row);
  }

  async update(userId: string, id: string, input: NewDeliveryLocation): Promise<DeliveryLocation> {
    // Scope the write to the owner so a mismatched userId can never touch a row it
    // doesn't own — count === 0 means no such address for this user (defence in depth
    // behind the use-case's ownership check).
    const { count } = await prisma.deliveryLocation.updateMany({
      where: { id, userId },
      data: {
        label: input.label,
        address: input.address,
        city: input.city ?? null,
        kind: input.kind,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    });
    if (count === 0) throw new NotFoundError("address", id);

    const row = await prisma.deliveryLocation.findFirstOrThrow({ where: { id, userId } });
    return toDeliveryLocation(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    // Scope the delete to the owner (defence behind the use-case's ownership check).
    // If the removed address was the default, promote the next-oldest so a user with
    // addresses left always keeps one selected — all in one transaction.
    await prisma.$transaction(async (tx) => {
      const existing = await tx.deliveryLocation.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundError("address", id);

      await tx.deliveryLocation.delete({ where: { id } });

      if (existing.isDefault) {
        const next = await tx.deliveryLocation.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (next) await tx.deliveryLocation.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }
}

type DeliveryLocationRow = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  kind: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

function toDeliveryLocation(row: DeliveryLocationRow): DeliveryLocation {
  return {
    id: row.id,
    label: row.label,
    address: row.address,
    city: row.city ?? undefined,
    kind: row.kind as DeliveryLocationKind,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    isDefault: row.isDefault,
  };
}
