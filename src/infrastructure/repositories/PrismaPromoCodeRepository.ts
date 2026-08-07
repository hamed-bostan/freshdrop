import { Prisma } from "@prisma/client";

import { createPage, toSkipTake, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import type {
  AdminPromoCode,
  AdminPromoCodeFilters,
  AdminPromoCodeSort,
  PromoCode,
} from "@/src/domain/entities/PromoCode";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import type { IPromoCodeRepository, NewPromoCode } from "@/src/domain/repositories/IPromoCodeRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

import { recordAudit } from "./writeActivityEntry";

/**
 * Promo codes backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaPromoCodeRepository implements IPromoCodeRepository {
  async getAvailable(): Promise<PromoCode[]> {
    // Stable, authored order (ids "1".."4") so the list reads the same each load.
    const rows = await prisma.promoCode.findMany({ where: liveWhere(), orderBy: { id: "asc" } });
    return rows.map(toPromoCode);
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const row = await prisma.promoCode.findFirst({
      where: { ...liveWhere(), code: { equals: code.trim(), mode: "insensitive" } },
    });
    return row ? toPromoCode(row) : null;
  }

  async list(
    filters: AdminPromoCodeFilters,
    page: PageRequest<AdminPromoCodeSort>,
  ): Promise<Page<AdminPromoCode>> {
    const where = adminWhere(filters);
    const { skip, take } = toSkipTake(page);

    // One round trip for the slice and the count it was cut from — `total` has to
    // describe the same filtered set the rows came from.
    const [rows, total] = await prisma.$transaction([
      prisma.promoCode.findMany({ where, orderBy: adminOrderBy(page), skip, take }),
      prisma.promoCode.count({ where }),
    ]);

    return createPage(rows.map(toAdminPromoCode), total, page);
  }

  async getById(id: string): Promise<AdminPromoCode | null> {
    const row = await prisma.promoCode.findUnique({ where: { id } });
    return row ? toAdminPromoCode(row) : null;
  }

  async getByCode(code: string): Promise<AdminPromoCode | null> {
    const row = await prisma.promoCode.findFirst({
      where: { code: { equals: code.trim(), mode: "insensitive" } },
    });
    return row ? toAdminPromoCode(row) : null;
  }

  async create(input: NewPromoCode, audit?: AuditHook<AdminPromoCode>): Promise<AdminPromoCode> {
    try {
      // Transactional so the campaign and the record of who authored it commit
      // together — see `recordAudit`.
      const row = await prisma.$transaction(async (tx) => {
        const created = await tx.promoCode.create({ data: toRowData(input) });
        await recordAudit(tx, toAdminPromoCode(created), audit);
        return created;
      });
      return toAdminPromoCode(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async update(id: string, input: NewPromoCode, audit?: AuditHook<AdminPromoCode>): Promise<AdminPromoCode> {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.promoCode.update({ where: { id }, data: toRowData(input) });
        await recordAudit(tx, toAdminPromoCode(updated), audit);
        return updated;
      });
      return toAdminPromoCode(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async setActive(
    id: string,
    active: boolean,
    audit?: AuditHook<AdminPromoCode>,
  ): Promise<AdminPromoCode> {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.promoCode.update({ where: { id }, data: { active } });
        await recordAudit(tx, toAdminPromoCode(updated), audit);
        return updated;
      });
      return toAdminPromoCode(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async recordUsage(id: string): Promise<void> {
    // `updateMany` rather than `update`: a code deleted between placing the order
    // and counting it should leave the counter alone, not throw P2025 into a path
    // whose whole contract is that it can't disturb an order that already exists.
    await prisma.promoCode.updateMany({ where: { id }, data: { usageCount: { increment: 1 } } });
  }
}

/**
 * The redeemability predicate, in SQL: switched on, started (or open-started), not
 * yet ended (or open-ended). `now` is evaluated per call, so a campaign goes live
 * and expires on its own without anything having to run on a schedule.
 *
 * Mirrors `isPromoLive` — that's the readable statement of this rule, applied to
 * rows already in hand; this is the one that keeps un-redeemable codes out of the
 * result set in the first place.
 */
function liveWhere(now: Date = new Date()): Prisma.PromoCodeWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

/** The admin list's filters, in SQL. Unlike the storefront's, it can see every state. */
function adminWhere(filters: AdminPromoCodeFilters, now: Date = new Date()): Prisma.PromoCodeWhereInput {
  const where: Prisma.PromoCodeWhereInput = {};

  if (filters.query) {
    // The two fields an operator actually searches by — the code they were given,
    // or the campaign's name.
    where.OR = [
      { code: { contains: filters.query, mode: "insensitive" } },
      { title: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  // Each status is the negation-free complement of the others, so the four filters
  // partition the table exactly — no row is in two, none in none.
  switch (filters.status) {
    case "active":
      Object.assign(where, liveWhere(now));
      break;
    case "inactive":
      where.active = false;
      break;
    case "scheduled":
      where.active = true;
      where.startsAt = { gt: now };
      break;
    case "expired":
      where.active = true;
      where.endsAt = { lte: now };
      break;
  }

  return where;
}

/** Translate the list's sort key into Prisma ordering. */
function adminOrderBy(
  page: PageRequest<AdminPromoCodeSort>,
): Prisma.PromoCodeOrderByWithRelationInput | Prisma.PromoCodeOrderByWithRelationInput[] {
  const direction = page.direction ?? "desc";
  switch (page.sort) {
    case "code":
      return { code: direction };
    case "discount":
      return { discountPercent: direction };
    case "usage":
      return { usageCount: direction };
    case "endsAt":
      // Open-ended campaigns sort last either way: "no end date" isn't a date, and
      // burying it among real ones would misread as the earliest or the latest.
      return [{ endsAt: { sort: direction, nulls: "last" } }, { createdAt: "desc" }];
    default:
      return { createdAt: direction };
  }
}

type PromoCodeRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
};

type AdminPromoCodeRow = PromoCodeRow & {
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageCount: number;
};

function toPromoCode(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    discountPercent: row.discountPercent,
  };
}

/** Map a row to the admin shape. Timestamps cross the wire as ISO strings, like every other entity's. */
function toAdminPromoCode(row: AdminPromoCodeRow): AdminPromoCode {
  return {
    ...toPromoCode(row),
    active: row.active,
    startsAt: row.startsAt?.toISOString(),
    endsAt: row.endsAt?.toISOString(),
    usageCount: row.usageCount,
  };
}

/** Map the domain's write shape onto columns — ISO strings back to `Date`, absent window ends to NULL. */
function toRowData(input: NewPromoCode) {
  return {
    code: input.code,
    title: input.title,
    description: input.description,
    discountPercent: input.discountPercent,
    active: input.active,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  };
}

/**
 * Translate Prisma's unique-violation (P2002) into a transport-agnostic domain
 * error so callers never branch on Prisma codes; every other error passes through.
 */
function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: unique violation. P2025: the targeted row no longer exists (lost a
    // race between a pre-write existence check and the write).
    if (error.code === "P2002") return new UniqueConstraintError(uniqueTargetFields(error), { cause: error });
    if (error.code === "P2025") return new NotFoundError("promo code", undefined, { cause: error });
  }
  return error;
}

/** Best-effort extraction of the offending field names from a P2002 `meta.target`. */
function uniqueTargetFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === "string") return [target];
  return [];
}
