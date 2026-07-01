import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
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

  async create(userId: string, input: NewDeliveryLocation): Promise<DeliveryLocation> {
    const row = await prisma.deliveryLocation.create({
      data: {
        userId,
        label: input.label,
        address: input.address,
        detailAddress: input.detailAddress ?? null,
        phone: input.phone ?? null,
        kind: input.kind,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    });
    return toDeliveryLocation(row);
  }
}

type DeliveryLocationRow = {
  id: string;
  label: string;
  address: string;
  detailAddress: string | null;
  phone: string | null;
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
    detailAddress: row.detailAddress ?? undefined,
    phone: row.phone ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}
