import { Prisma, type PrismaClient } from "@prisma/client";
import type { DateRange } from "@/src/domain/entities/Analytics";
import type { DeliveryIssue, DeliveryIssueStatus, DeliveryIssueType, NewDeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { DeliveryIssueFilter, IDeliveryIssueRepository } from "@/src/domain/repositories/IDeliveryIssueRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

type DeliveryIssueRow = {
  id: string;
  orderId: string;
  orderNumber: number;
  zone: string;
  type: DeliveryIssueType;
  status: DeliveryIssueStatus;
  driverId: string | null;
  driverName: string | null;
  delayMinutes: number;
  createdAt: Date;
};

/**
 * Every column the presentation layer needs, in one join — `zone`/`orderNumber`/
 * `driverName` are live lookups (they read correctly even if the order or driver
 * changes later); `driver_id`/`delay_minutes` on `delivery_issues` are the
 * snapshot fields (see that model's doc).
 */
const SELECT = Prisma.sql`
  SELECT
    i.id,
    i.order_id AS "orderId",
    o.order_number AS "orderNumber",
    COALESCE(o.city, 'Unspecified') AS zone,
    i.type,
    i.status,
    i.driver_id AS "driverId",
    d.name AS "driverName",
    i.delay_minutes AS "delayMinutes",
    i.created_at AS "createdAt"
  FROM delivery_issues i
  JOIN orders o ON o.id = i.order_id
  LEFT JOIN drivers d ON d.id = i.driver_id
`;

/**
 * Delivery incidents backed by PostgreSQL via Prisma. Server-side only, bound
 * through the container.
 *
 * `db` defaults to the app's singleton but is overridable — the integration
 * suite passes the migrated `freshdrop_test` client so its writes and this
 * repository's raw-SQL reads land in the same database, like `PrismaAnalyticsRepository`.
 */
export class PrismaDeliveryIssueRepository implements IDeliveryIssueRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listForOrder(orderId: string): Promise<DeliveryIssue[]> {
    const rows = await this.db.$queryRaw<DeliveryIssueRow[]>(
      Prisma.sql`${SELECT} WHERE i.order_id = ${orderId} ORDER BY i.created_at DESC`,
    );
    return rows.map(toIssue);
  }

  async listForReport(range: DateRange, filter: DeliveryIssueFilter, limit: number): Promise<DeliveryIssue[]> {
    const conditions = [Prisma.sql`i.created_at >= ${range.from} AND i.created_at < ${range.to}`];
    if (filter.status) conditions.push(Prisma.sql`i.status = ${filter.status}`);
    if (filter.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(Prisma.sql`(o.order_number::text ILIKE ${term} OR COALESCE(o.city, 'Unspecified') ILIKE ${term} OR d.name ILIKE ${term})`);
    }
    const where = conditions.reduce((acc, condition) => Prisma.sql`${acc} AND ${condition}`);
    const rows = await this.db.$queryRaw<DeliveryIssueRow[]>(
      Prisma.sql`${SELECT} WHERE ${where} ORDER BY i.created_at DESC LIMIT ${Math.max(1, Math.min(limit, 50))}`,
    );
    return rows.map(toIssue);
  }

  async create(input: NewDeliveryIssue): Promise<DeliveryIssue> {
    const order = await this.db.order.findUnique({ where: { id: input.orderId }, select: { driverId: true } });
    if (!order) throw new NotFoundError("order", input.orderId);

    // The order's driver at this moment, snapshotted onto the issue — see the
    // `DeliveryIssue` model doc.
    const created = await this.db.deliveryIssue.create({
      data: { orderId: input.orderId, type: input.type, delayMinutes: input.delayMinutes, driverId: order.driverId },
    });
    return this.findById(created.id);
  }

  async updateStatus(id: string, status: DeliveryIssueStatus): Promise<DeliveryIssue> {
    try {
      await this.db.deliveryIssue.update({ where: { id }, data: { status } });
    } catch {
      throw new NotFoundError("deliveryIssue", id);
    }
    return this.findById(id);
  }

  private async findById(id: string): Promise<DeliveryIssue> {
    const rows = await this.db.$queryRaw<DeliveryIssueRow[]>(Prisma.sql`${SELECT} WHERE i.id = ${id}`);
    const row = rows[0];
    if (!row) throw new NotFoundError("deliveryIssue", id);
    return toIssue(row);
  }
}

function toIssue(row: DeliveryIssueRow): DeliveryIssue {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    zone: row.zone,
    type: row.type,
    status: row.status,
    driverId: row.driverId,
    driverName: row.driverName,
    delayMinutes: row.delayMinutes,
    createdAt: row.createdAt.toISOString(),
  };
}
