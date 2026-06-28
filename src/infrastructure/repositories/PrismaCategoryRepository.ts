import { Prisma } from "@prisma/client";
import type { Category } from "@/src/domain/entities/Category";
import type { ICategoryRepository, NewCategory } from "@/src/domain/repositories/ICategoryRepository";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Categories backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toCategory);
  }

  async getById(id: string): Promise<Category | null> {
    const row = await prisma.category.findUnique({ where: { id } });
    return row ? toCategory(row) : null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const row = await prisma.category.findUnique({ where: { slug } });
    return row ? toCategory(row) : null;
  }

  async create(input: NewCategory): Promise<Category> {
    try {
      const row = await prisma.category.create({ data: input });
      return toCategory(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async update(id: string, input: NewCategory): Promise<Category> {
    try {
      const row = await prisma.category.update({ where: { id }, data: input });
      return toCategory(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }
}

/** Map a Prisma row to the domain entity (dropping DB-only timestamps). */
function toCategory(row: { id: string; name: string; slug: string; iconUrl: string }): Category {
  return { id: row.id, name: row.name, slug: row.slug, iconUrl: row.iconUrl };
}

/**
 * Translate Prisma's unique-violation (P2002) into a transport-agnostic domain
 * error so callers never branch on Prisma codes; every other error passes through.
 */
function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new UniqueConstraintError(uniqueTargetFields(error), { cause: error });
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
