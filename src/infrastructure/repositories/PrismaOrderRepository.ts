import { Prisma } from "@prisma/client";
import type {
  DeliveryType,
  ItemSubstitution,
  Order,
  OrderItem,
  OrderPhase,
  OrderStatus,
  PaymentStatus,
  SubstitutionPreference,
} from "@/src/domain/entities/Order";
import type { Refund } from "@/src/domain/entities/Refund";
import { pipelinePredicate } from "@/src/domain/entities/OrderPipelineStage";
import type { AdminOrderFilters, AdminOrderSort } from "@/src/domain/entities/AdminOrderFilters";
import { DEFAULT_ADMIN_ORDER_DIRECTION } from "@/src/domain/entities/AdminOrderFilters";
import { createPage, toSkipTake, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type {
  IOrderRepository,
  NewOrder,
  OrderStatusTransition,
  OrderTrackingUpdate,
} from "@/src/domain/repositories/IOrderRepository";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";
import { recordAudit } from "./writeActivityEntry";
import { toRefund } from "./PrismaRefundRepository";

/** Items are always read in their authored order so the order card's thumbnails stay stable. */
const ITEMS_INCLUDE = { items: { orderBy: { position: "asc" } } } as const;

/**
 * Attach each order's `Refund` rows in one batched query rather than one per order
 * — the same reasoning `ITEMS_INCLUDE` follows, just not expressible as a Prisma
 * relation (`Refund.orderId` is a loose reference, like the rest of the schema).
 */
async function attachRefunds(db: PrismaDb, orders: Order[]): Promise<Order[]> {
  if (orders.length === 0) return orders;
  const rows = await db.refund.findMany({
    where: { orderId: { in: orders.map((order) => order.id) } },
    include: { lines: true },
    orderBy: { createdAt: "asc" },
  });
  const byOrder = new Map<string, Refund[]>();
  for (const row of rows) {
    const refund = toRefund(row);
    const list = byOrder.get(refund.orderId);
    if (list) list.push(refund);
    else byOrder.set(refund.orderId, [refund]);
  }
  return orders.map((order) => ({ ...order, refunds: byOrder.get(order.id) ?? [] }));
}

/** Single-order convenience over {@link attachRefunds}. */
async function attachRefund(db: PrismaDb, order: Order): Promise<Order> {
  const [withRefunds] = await attachRefunds(db, [order]);
  return withRefunds;
}

/**
 * Orders backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaOrderRepository implements IOrderRepository {
  /**
   * The root client normally, a transaction client when a unit of work handed this
   * repository out — see `PrismaUnitOfWork`.
   */
  constructor(private readonly db: PrismaDb = prisma) {}

  async getOrders(userId: string): Promise<Order[]> {
    const rows = await this.db.order.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      include: ITEMS_INCLUDE,
    });
    return attachRefunds(this.db, rows.map(toOrder));
  }

  async getAllOrders(): Promise<Order[]> {
    const rows = await this.db.order.findMany({
      orderBy: { placedAt: "desc" },
      include: ITEMS_INCLUDE,
    });
    return attachRefunds(this.db, rows.map(toOrder));
  }

  async listPage(filters: AdminOrderFilters, page: PageRequest<AdminOrderSort>): Promise<Page<Order>> {
    const where = toOrderWhere(filters);

    const direction = page.direction ?? DEFAULT_ADMIN_ORDER_DIRECTION;
    const orderBy: Prisma.OrderOrderByWithRelationInput =
      page.sort === "total" ? { total: direction } : { placedAt: direction };

    const { skip, take } = toSkipTake(page);
    // One transaction so the rows and the count come from the same snapshot —
    // an order placed between two separate reads would leave the pager offering
    // a page that isn't there.
    const [orders, total] = await inTransaction(this.db, async (tx) => {
      const [rows, total] = await Promise.all([
        tx.order.findMany({ where, orderBy, skip, take, include: ITEMS_INCLUDE }),
        tx.order.count({ where }),
      ]);
      return [await attachRefunds(tx, rows.map(toOrder)), total] as const;
    });

    return createPage(orders, total, page);
  }

  async getById(orderId: string): Promise<Order | null> {
    const row = await this.db.order.findUnique({
      where: { id: orderId },
      include: ITEMS_INCLUDE,
    });
    return row ? attachRefund(this.db, toOrder(row)) : null;
  }

  async lockById(orderId: string): Promise<Order | null> {
    return inTransaction(this.db, async (tx) => {
      // `SELECT ... FOR UPDATE` rather than a Prisma read: Prisma has no lock
      // clause, and the lock — not the row it returns — is the point. A second
      // call on the same id blocks here until this transaction commits or rolls
      // back, which is what makes the caller's re-summed `refunds` trustworthy.
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      if (locked.length === 0) return null;

      const row = await tx.order.findUnique({ where: { id: orderId }, include: ITEMS_INCLUDE });
      if (!row) return null;
      return attachRefund(tx, toOrder(row));
    });
  }

  async createOrder(input: NewOrder, audit?: AuditHook<Order>): Promise<Order> {
    // Wrapped only when there's an entry to write, so checkout's create stays the
    // single statement it has always been. `inTransaction` joins the caller's
    // transaction when there is one — and `placeOrder` always has one open, since
    // the stock claim and the slot claim commit with this row.
    if (audit) {
      const row = await inTransaction(this.db, async (tx) => {
        const created = await tx.order.create({ data: toOrderCreateData(input), include: ITEMS_INCLUDE });
        await recordAudit(tx, toOrder(created), audit);
        return created;
      });
      return toOrder(row);
    }

    const row = await this.db.order.create({
      data: toOrderCreateData(input),
      include: ITEMS_INCLUDE,
    });
    return toOrder(row);
  }

  async setTrackingStage(
    orderId: string,
    update: OrderTrackingUpdate,
    audit?: AuditHook<Order>,
  ): Promise<Order> {
    try {
      return await inTransaction(this.db, async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { stage: update.stage, status: update.status },
          include: ITEMS_INCLUDE,
        });
        const order = await attachRefund(tx, toOrder(updated));
        await recordAudit(tx, order, audit);
        return order;
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async transitionStatus(
    orderId: string,
    transition: OrderStatusTransition,
    audit?: AuditHook<Order>,
  ): Promise<Order | null> {
    const { from, to } = transition;

    return inTransaction(this.db, async (tx) => {
      // The `from` precondition is folded into the WHERE clause, so the match and
      // the write are one atomic statement — `count` is 1 only when this call is
      // the one that actually moved the order out of the expected state.
      const result = await tx.order.updateMany({
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
          ...(to.paymentStatus !== undefined ? { paymentStatus: to.paymentStatus } : {}),
        },
      });

      // Lost the guard, so this call changed nothing — and must not claim in the
      // log to have made a decision another call actually made.
      if (result.count === 0) return null;

      // Read through `tx`, not `this.getById`: the update above is uncommitted, so
      // a read on another connection would return the pre-transition order.
      const row = await tx.order.findUnique({ where: { id: orderId }, include: ITEMS_INCLUDE });
      if (!row) return null;

      const order = await attachRefund(tx, toOrder(row));
      await recordAudit(tx, order, audit);
      return order;
    });
  }

  async resolveItemSubstitution(
    orderId: string,
    productId: string,
    resolution: ItemSubstitution,
    audit?: AuditHook<Order>,
  ): Promise<Order | null> {
    return inTransaction(this.db, async (tx) => {
      // The "still unresolved" precondition (`substitutionStatus: null`) is folded
      // into the WHERE clause, so the guard and the write are one atomic statement
      // — `count` is 1 only for the call that actually resolved the line.
      const result = await tx.orderItem.updateMany({
        where: { orderId, productId, substitutionStatus: null },
        data: {
          substitutionStatus: resolution.status,
          substitutionRefundAmount: resolution.refundAmount,
          replacementProductId: resolution.replacement?.productId ?? null,
          replacementName: resolution.replacement?.name ?? null,
          replacementImageUrl: resolution.replacement?.imageUrl ?? null,
        },
      });

      // Lost the race — another pick already resolved this line. No entry, for the
      // same reason as above.
      if (result.count === 0) return null;

      const row = await tx.order.findUnique({ where: { id: orderId }, include: ITEMS_INCLUDE });
      if (!row) return null;

      const order = await attachRefund(tx, toOrder(row));
      await recordAudit(tx, order, audit);
      return order;
    });
  }
}

/** The persisted columns an Order maps from (DB-only timestamps dropped). */
type OrderRow = {
  id: string;
  orderNumber: number;
  userId: string;
  status: string;
  phase: string;
  deliveryType: string;
  paymentStatus: string;
  placedAt: Date;
  location: string;
  locationLabel: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  taxAmount: number | null;
  taxRate: number | null;
  stage: string | null;
  deliveryDate: string | null;
  deliveryWindowId: string | null;
  deliveryWindow: string | null;
  items: {
    id: string;
    productId: string;
    name: string;
    imageUrl: string;
    quantity: number;
    price: number;
    substitutionPreference: string;
    substitutionStatus: string | null;
    substitutionRefundAmount: number | null;
    replacementProductId: string | null;
    replacementName: string | null;
    replacementImageUrl: string | null;
    taxExempt: boolean;
    taxAmount: number | null;
  }[];
};

/**
 * Map a Prisma row to the domain entity. The status/phase/stage columns are plain
 * strings on the wire (the schema is enum-free) but only ever hold the domain
 * union values, so they're narrowed here; a NULL stage collapses to `undefined`.
 */
/**
 * Translate the admin list's filters into one `where` clause.
 *
 * All of it happens in the query rather than over the fetched page, so the count
 * and the rows agree — filtering afterwards would page a set the total doesn't
 * describe, and the pager would offer pages that aren't there.
 *
 * The pipeline filter is the reason this is a function: it's the one filter that
 * isn't a column, resolving to a `(status, stage)` pair where `stage: null` ("not
 * yet confirmed") is a genuinely different predicate from an absent stage
 * constraint. See `OrderPipelineStage`.
 */
function toOrderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];

  // The term is one filter with three ways to match: the order's own id, its
  // human-facing number (with or without the leading "#" the UI shows it with),
  // or the customer it resolved to. One OR-group inside the AND, so it narrows
  // *with* the other filters rather than widening past them — flattened into the
  // top-level AND, a customer match would drag in orders of every status.
  if (filters.query) {
    const or: Prisma.OrderWhereInput[] = [
      { id: { contains: filters.query, mode: "insensitive" } },
    ];
    const asOrderNumber = Number.parseInt(filters.query.replace(/^#/, ""), 10);
    if (Number.isInteger(asOrderNumber) && asOrderNumber > 0) or.push({ orderNumber: asOrderNumber });
    if (filters.userIds?.length) or.push({ userId: { in: filters.userIds } });
    and.push({ OR: or });
  }

  if (filters.pipeline) {
    const predicate = pipelinePredicate(filters.pipeline);
    and.push({ status: predicate.status });
    if (predicate.stage !== undefined) and.push({ stage: predicate.stage });
  }

  if (filters.deliveryType) and.push({ deliveryType: filters.deliveryType });
  if (filters.paymentStatus) and.push({ paymentStatus: filters.paymentStatus });

  // Bounds are inclusive and independently optional, so a half-open range
  // ("everything since Monday") is expressible.
  if (filters.placedFrom) and.push({ placedAt: { gte: new Date(filters.placedFrom) } });
  if (filters.placedTo) and.push({ placedAt: { lte: new Date(filters.placedTo) } });
  if (filters.minTotal != null) and.push({ total: { gte: filters.minTotal } });
  if (filters.maxTotal != null) and.push({ total: { lte: filters.maxTotal } });

  return and.length ? { AND: and } : {};
}

/** The row an order is written as. Shared by both branches of `createOrder`, so the audited path can't drift from the plain one. */
function toOrderCreateData(input: NewOrder): Prisma.OrderCreateInput {
  return {
    // Undefined when the caller didn't mint one, leaving the column's
    // `@default(uuid())` to assign it.
    id: input.id,
    userId: input.userId,
    status: input.status,
    phase: input.phase,
    deliveryType: input.deliveryType,
    paymentStatus: input.paymentStatus,
    placedAt: new Date(input.placedAt),
    location: input.location,
    locationLabel: input.locationLabel ?? null,
    destinationLat: input.destination?.latitude ?? null,
    destinationLng: input.destination?.longitude ?? null,
    subtotal: input.subtotal,
    shipping: input.shipping,
    discount: input.discount,
    total: input.total,
    taxAmount: input.taxAmount,
    taxRate: input.taxRate,
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
        price: item.price,
        substitutionPreference: item.substitutionPreference,
        position: index + 1,
        taxExempt: item.taxExempt,
        taxAmount: item.taxAmount,
      })),
    },
  };
}

function toOrder(row: OrderRow): Order {
  const items: OrderItem[] = row.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    price: item.price,
    taxExempt: item.taxExempt,
    taxAmount: item.taxAmount,
    // Plain string columns that only ever hold the domain union values (the app
    // validates them), narrowed here — consistent with status/phase/stage above.
    substitutionPreference: item.substitutionPreference as SubstitutionPreference,
    substitution:
      item.substitutionStatus == null
        ? undefined
        : {
            status: item.substitutionStatus as ItemSubstitution["status"],
            // Null only for rows resolved before this column existed — treat as 0.
            refundAmount: item.substitutionRefundAmount ?? 0,
            replacement: item.replacementProductId
              ? {
                  productId: item.replacementProductId,
                  name: item.replacementName ?? "",
                  imageUrl: item.replacementImageUrl ?? "",
                }
              : undefined,
          },
  }));

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    status: row.status as OrderStatus,
    phase: row.phase as OrderPhase,
    deliveryType: row.deliveryType as DeliveryType,
    paymentStatus: row.paymentStatus as PaymentStatus,
    placedAt: row.placedAt.toISOString(),
    location: row.location,
    locationLabel: row.locationLabel ?? undefined,
    // Both columns are written together at checkout; a half-set pair can't describe
    // a point, so the destination only exists when both are present.
    destination:
      row.destinationLat != null && row.destinationLng != null
        ? { latitude: row.destinationLat, longitude: row.destinationLng }
        : undefined,
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    taxAmount: row.taxAmount,
    taxRate: row.taxRate,
    stage: (row.stage as TrackingMilestone | null) ?? undefined,
    deliveryDate: row.deliveryDate ?? undefined,
    deliveryWindowId: row.deliveryWindowId ?? undefined,
    deliveryWindow: row.deliveryWindow ?? undefined,
    items,
    // The correct value for a brand-new order (`createOrder`); every other caller
    // overwrites this with the real ledger via `attachRefund`/`attachRefunds`.
    refunds: [],
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
