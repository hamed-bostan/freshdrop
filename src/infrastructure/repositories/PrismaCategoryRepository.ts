import { Prisma } from "@prisma/client";
import type { Category } from "@/src/domain/entities/Category";
import type {
  CategoryTranslationInput,
  ICategoryRepository,
  NewCategory,
} from "@/src/domain/repositories/ICategoryRepository";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { prisma } from "@/src/infrastructure/prisma/client";
import { recordAudit } from "./writeActivityEntry";

/**
 * Categories backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaCategoryRepository implements ICategoryRepository {
  async getAll(locale?: string): Promise<Category[]> {
    const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    return localizeCategories(rows.map(toCategory), locale);
  }

  async getById(id: string, locale?: string): Promise<Category | null> {
    const row = await prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    return (await localizeCategories([toCategory(row)], locale))[0];
  }

  async getBySlug(slug: string, locale?: string): Promise<Category | null> {
    const row = await prisma.category.findUnique({ where: { slug } });
    if (!row) return null;
    return (await localizeCategories([toCategory(row)], locale))[0];
  }

  async create(input: NewCategory, audit?: AuditHook<Category>): Promise<Category> {
    // `translations` isn't a `categories` column — persist it into the side table.
    const { translations, ...data } = input;
    try {
      const row = await prisma.$transaction(async (tx) => {
        const created = await tx.category.create({ data });
        await recordAudit(tx, toCategory(created), audit);
        return created;
      });
      await replaceCategoryTranslations(row.id, translations);
      return toCategory(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async update(id: string, input: NewCategory, audit?: AuditHook<Category>): Promise<Category> {
    const { translations, ...data } = input;
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.category.update({ where: { id }, data });
        await recordAudit(tx, toCategory(updated), audit);
        return updated;
      });
      await replaceCategoryTranslations(row.id, translations);
      return toCategory(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async getTranslations(categoryId: string): Promise<CategoryTranslationInput[]> {
    const rows = await prisma.categoryTranslation.findMany({
      where: { categoryId },
      orderBy: { locale: "asc" },
    });
    return rows.map((row) => ({ locale: row.locale, name: row.name }));
  }

  async delete(id: string, audit?: AuditHook<void>): Promise<void> {
    try {
      // Transactional: the entry is the only surviving record of the category.
      await prisma.$transaction(async (tx) => {
        await tx.category.delete({ where: { id } });
        await recordAudit(tx, undefined, audit);
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }
}

/** Map a Prisma row to the domain entity (dropping DB-only timestamps). */
function toCategory(row: { id: string; name: string; slug: string; iconUrl: string }): Category {
  return { id: row.id, name: row.name, slug: row.slug, iconUrl: row.iconUrl };
}

/**
 * Persist a category's per-locale translations to the side table. `undefined` leaves
 * them untouched; a list replaces the set — locales absent from it are deleted (so
 * `[]` clears all), the rest upserted.
 */
async function replaceCategoryTranslations(
  categoryId: string,
  translations?: CategoryTranslationInput[],
): Promise<void> {
  if (translations === undefined) return;

  const locales = translations.map((t) => t.locale);
  const where: Prisma.CategoryTranslationWhereInput = { categoryId };
  if (locales.length > 0) where.locale = { notIn: locales };

  // One atomic batch — the delete and the upserts land together or not at all, so a
  // failure mid-way can't leave the translation set half-replaced.
  await prisma.$transaction([
    prisma.categoryTranslation.deleteMany({ where }),
    ...translations.map((t) =>
      prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId, locale: t.locale } },
        create: { categoryId, locale: t.locale, name: t.name },
        update: { name: t.name },
      }),
    ),
  ]);
}

/**
 * Overlay per-locale translations onto canonical categories. For the default locale
 * (no `locale` passed) the base names are returned as-is; otherwise a category's
 * translated `name` replaces the canonical one, falling back to the base name when no
 * translation row exists.
 */
async function localizeCategories(categories: Category[], locale?: string): Promise<Category[]> {
  if (!locale || categories.length === 0) return categories;

  const translations = await prisma.categoryTranslation.findMany({
    where: { locale, categoryId: { in: categories.map((c) => c.id) } },
  });
  if (translations.length === 0) return categories;

  const nameById = new Map(translations.map((t) => [t.categoryId, t.name]));
  return categories.map((category) => {
    const name = nameById.get(category.id);
    return name ? { ...category, name } : category;
  });
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
    if (error.code === "P2025") return new NotFoundError("category", undefined, { cause: error });
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
