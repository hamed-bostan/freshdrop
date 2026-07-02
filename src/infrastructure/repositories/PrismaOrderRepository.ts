import { Prisma } from "@prisma/client";
import type { Order, OrderItem, OrderPhase, OrderStatus } from "@/src/domain/entities/Order";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type {
  IOrderRepository,
  NewOrder,
  OrderStatusTransition,
  OrderTrackingUpdate,
} from "@/src/domain/repositories/IOrderRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";

/** Items are always read in their authored order so the order card's thumbnails stay stable. */
const ITEMS_INCLUDE = { items: { orderBy: { position: "asc" } } } as const;

/**
 * Orders backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaOrderRepository implements IOrderRepository {
  async getOrders(userId: string): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      include: ITEMS_INCLUDE,
    });
    return rows.map(toOrder);
  }

  async getAllOrders(): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: ITEMS_INCLUDE,
    });
    return rows.map(toOrder);
  }

  async getById(orderId: string): Promise<Order | null> {
    const row = await prisma.order.findUnique({
      where: { id: orderId },
      include: ITEMS_INCLUDE,
    });
    return row ? toOrder(row) : null;
  }

  async createOrder(input: NewOrder): Promise<Order> {
    const row = await prisma.order.create({
      data: {
        userId: input.userId,
        status: input.status,
        phase: input.phase,
        placedAt: new Date(input.placedAt),
        location: input.location,
        total: input.total,
        stage: input.stage ?? null,
        deliveryDate: input.deliveryDate ?? null,
        deliveryWindowId: input.deliveryWindowId ?? null,
        deliveryWindow: input.deliveryWindow ?? null,
        items: {
          create: input.items.map((item, index) => ({
            productId: item.productId,
            name: item.name,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            position: index + 1,
          })),
        },
      },
      include: ITEMS_INCLUDE,
    });
    return toOrder(row);
  }

  async setTrackingStage(orderId: string, update: OrderTrackingUpdate): Promise<Order> {
    try {
      const row = await prisma.order.update({
        where: { id: orderId },
        data: { stage: update.stage, status: update.status },
        include: ITEMS_INCLUDE,
      });
      return toOrder(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async transitionStatus(orderId: string, transition: OrderStatusTransition): Promise<Order | null> {
    const { from, to } = transition;

    // The `from` precondition is folded into the WHERE clause, so the match and
    // the write are one atomic statement — `count` is 1 only when this call is
    // the one that actually moved the order out of the expected state.
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: from.status,
        ...(from.stage !== undefined ? { stage: from.stage } : {}),
      },
      data: {
        status: to.status,
        ...(to.phase !== undefined ? { phase: to.phase } : {}),
        // `null` clears the stage; `undefined` leaves it untouched.
        ...(to.stage !== undefined ? { stage: to.stage } : {}),
      },
    });

    if (result.count === 0) return null;
    return this.getById(orderId);
  }
}

/** The persisted columns an Order maps from (DB-only timestamps dropped). */
type OrderRow = {
  id: string;
  userId: string;
  status: string;
  phase: string;
  placedAt: Date;
  location: string;
  total: number;
  stage: string | null;
  deliveryDate: string | null;
  deliveryWindowId: string | null;
  deliveryWindow: string | null;
  items: { productId: string; name: string; imageUrl: string; quantity: number }[];
};

/**
 * Map a Prisma row to the domain entity. The status/phase/stage columns are plain
 * strings on the wire (the schema is enum-free) but only ever hold the domain
 * union values, so they're narrowed here; a NULL stage collapses to `undefined`.
 */
function toOrder(row: OrderRow): Order {
  const items: OrderItem[] = row.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
  }));

  return {
    id: row.id,
    userId: row.userId,
    status: row.status as OrderStatus,
    phase: row.phase as OrderPhase,
    placedAt: row.placedAt.toISOString(),
    location: row.location,
    total: row.total,
    stage: (row.stage as TrackingMilestone | null) ?? undefined,
    deliveryDate: row.deliveryDate ?? undefined,
    deliveryWindowId: row.deliveryWindowId ?? undefined,
    deliveryWindow: row.deliveryWindow ?? undefined,
    items,
  };
}

/**
 * Translate Prisma's known request errors into transport-agnostic domain errors
 * so callers never branch on Prisma codes; every other error passes through.
 */
function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: the targeted order row no longer exists.
    if (error.code === "P2025") return new NotFoundError("order", undefined, { cause: error });
  }
  return error;
}
