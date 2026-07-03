import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import type {
  IDeliveryLocationRepository,
  NewDeliveryLocation,
} from "@/src/domain/repositories/IDeliveryLocationRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
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
    const row = await prisma.deliveryLocation.create({
      data: {
        userId,
        label: input.label,
        address: input.address,
        kind: input.kind,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
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
    // Scope the delete to the owner so a mismatched userId can never remove a row it
    // doesn't own — count === 0 means no such address for this user (defence in depth
    // behind the use-case's ownership check).
    const { count } = await prisma.deliveryLocation.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundError("address", id);
  }
}

type DeliveryLocationRow = {
  id: string;
  label: string;
  address: string;
  kind: string;
  latitude: number | null;
  longitude: number | null;
};

function toDeliveryLocation(row: DeliveryLocationRow): DeliveryLocation {
  return {
    id: row.id,
    label: row.label,
    address: row.address,
    kind: row.kind as DeliveryLocationKind,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}
