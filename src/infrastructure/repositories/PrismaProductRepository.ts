import { Prisma } from "@prisma/client";
import type { Product } from "@/src/domain/entities/Product";
import type { ProductFilters, ProductSort } from "@/src/domain/entities/ProductFilters";
import type { IProductRepository, NewProduct, StockAdjustment } from "@/src/domain/repositories/IProductRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { InsufficientStockError, type StockShortfall } from "@/src/domain/errors/InsufficientStockError";
import { prisma } from "@/src/infrastructure/prisma/client";

/** How many related products the detail screen's "Similar To This Item" rail shows. */
const SIMILAR_LIMIT = 6;

/**
 * Products backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaProductRepository implements IProductRepository {
  async getAll(locale?: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
    return localizeProducts(rows.map(toProduct), locale);
  }

  async getById(id: string, locale?: string): Promise<Product | null> {
    const row = await prisma.product.findUnique({ where: { id } });
    if (!row) return null;
    return (await localizeProducts([toProduct(row)], locale))[0];
  }

  async getFeatured(locale?: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({ where: { isFeatured: true }, orderBy: { createdAt: "asc" } });
    return localizeProducts(rows.map(toProduct), locale);
  }

  async getSpecialOffers(locale?: string): Promise<Product[]> {
    // "Special offers" are products carrying a badge — mirrors the mock's rule.
    const rows = await prisma.product.findMany({ where: { badge: { not: null } }, orderBy: { createdAt: "asc" } });
    return localizeProducts(rows.map(toProduct), locale);
  }

  async search(filters: ProductFilters, locale?: string): Promise<Product[]> {
    // Each supplied filter is one AND clause; the text term matches name OR
    // description (case-insensitive), dietary/brand match ANY of their values.
    // Alphabetical by name is a stable default; relevance ranking and sort follow.
    const and: Prisma.ProductWhereInput[] = [];

    if (filters.query) {
      const or: Prisma.ProductWhereInput[] = [
        { name: { contains: filters.query, mode: "insensitive" } },
        { description: { contains: filters.query, mode: "insensitive" } },
      ];
      // Also match the localized text so a search in the active language finds the
      // product (e.g. «انگور» → «انگور بی‌دانه»). Translations live in a side table
      // with no Prisma relation (the schema's loose coupling), so resolve the
      // matching product ids first, then widen the OR by id. Canonical (English)
      // matching stays too — a query in either language works.
      if (locale) {
        const matches = await prisma.productTranslation.findMany({
          where: {
            locale,
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { description: { contains: filters.query, mode: "insensitive" } },
            ],
          },
          select: { productId: true },
        });
        if (matches.length > 0) or.push({ id: { in: matches.map((m) => m.productId) } });
      }
      and.push({ OR: or });
    }
    if (filters.categoryId) and.push({ categoryId: filters.categoryId });
    if (filters.minPrice != null) and.push({ price: { gte: filters.minPrice } });
    if (filters.maxPrice != null) and.push({ price: { lte: filters.maxPrice } });
    if (filters.dietary?.length) and.push({ dietary: { hasSome: filters.dietary } });
    if (filters.brands?.length) and.push({ brand: { in: filters.brands } });

    const rows = await prisma.product.findMany({
      where: and.length ? { AND: and } : {},
      orderBy: orderByFor(filters.sort),
    });
    // Matched on canonical + localized text above; localize the rows for display.
    return localizeProducts(rows.map(toProduct), locale);
  }

  async getSimilar(productId: string, locale?: string): Promise<Product[]> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return [];

    // Same-category siblings first, then top up with other products so the rail
    // always has something to show.
    const [sameCategory, others] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: productId } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.product.findMany({
        where: { categoryId: { not: product.categoryId } },
        orderBy: { createdAt: "asc" },
        take: SIMILAR_LIMIT,
      }),
    ]);

    return localizeProducts([...sameCategory, ...others].slice(0, SIMILAR_LIMIT).map(toProduct), locale);
  }

  async create(input: NewProduct): Promise<Product> {
    try {
      const row = await prisma.product.create({ data: input });
      return toProduct(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async update(id: string, input: NewProduct): Promise<Product> {
    try {
      const row = await prisma.product.update({ where: { id }, data: input });
      return toProduct(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.product.delete({ where: { id } });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async decrementStock(lines: readonly StockAdjustment[]): Promise<void> {
    if (lines.length === 0) return;

    // One interactive transaction so all lines commit together or not at all.
    // Each decrement is a conditional `updateMany` guarded by `stockQuantity >=
    // quantity`: the guard and the write are a single atomic statement, so two
    // concurrent orders can't both read the same stock and oversell — the loser's
    // guard fails (0 rows) and we roll the whole order back. Throwing out of the
    // callback aborts the transaction, undoing any decrements already applied.
    await prisma.$transaction(async (tx) => {
      const shortfalls: StockShortfall[] = [];

      for (const line of lines) {
        const result = await tx.product.updateMany({
          where: { id: line.productId, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });

        // No row matched: either the product is gone or it's short. Read the
        // current level (0 when absent) so the error can say how many are left.
        if (result.count === 0) {
          const current = await tx.product.findUnique({
            where: { id: line.productId },
            select: { stockQuantity: true },
          });
          shortfalls.push({
            productId: line.productId,
            name: line.name,
            available: current?.stockQuantity ?? 0,
            requested: line.quantity,
          });
        }
      }

      if (shortfalls.length > 0) throw new InsufficientStockError(shortfalls);
    });
  }

  async incrementStock(lines: readonly StockAdjustment[]): Promise<void> {
    if (lines.length === 0) return;

    // The inverse of `decrementStock`: returning stock always succeeds, so there's
    // no guard and no shortfall path. One transaction keeps the lines atomic;
    // `updateMany` silently matches nothing for a since-deleted product (count 0),
    // so a missing product is skipped rather than erroring.
    await prisma.$transaction(
      lines.map((line) =>
        prisma.product.updateMany({
          where: { id: line.productId },
          data: { stockQuantity: { increment: line.quantity } },
        }),
      ),
    );
  }
}

/** Map a sort option to a Prisma `orderBy`; defaults to alphabetical by name. */
function orderByFor(sort: ProductSort | undefined): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "rating":
      return { rating: "desc" };
    default:
      return { name: "asc" };
  }
}

/** The persisted columns a Product maps from (DB-only timestamps dropped). */
type ProductRow = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  ratingCount: number;
  stockQuantity: number;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  badge: string | null;
  unit: string | null;
  description: string | null;
  nutrition: string | null;
  origin: string | null;
  brand: string | null;
  dietary: string[];
};

/**
 * Map a Prisma row to the domain entity. `discountPercent` is derived (never
 * stored) so it can't drift from the prices; nullable columns collapse to the
 * entity's optional (`undefined`) fields.
 */
function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    discountPercent:
      row.originalPrice != null ? Math.round((1 - row.price / row.originalPrice) * 100) : undefined,
    rating: row.rating,
    ratingCount: row.ratingCount,
    stockQuantity: row.stockQuantity,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    isFeatured: row.isFeatured,
    badge: row.badge ?? undefined,
    unit: row.unit ?? undefined,
    description: row.description ?? undefined,
    nutrition: row.nutrition ?? undefined,
    origin: row.origin ?? undefined,
    brand: row.brand ?? undefined,
    dietary: row.dietary,
  };
}

/**
 * Overlay per-locale translations onto canonical products. For the default locale (no
 * `locale` passed) the base rows are returned as-is; otherwise each product's
 * translated fields (when present) replace the canonical text, falling back
 * field-by-field to the base row. One extra indexed query per non-default-locale read.
 */
async function localizeProducts(products: Product[], locale?: string): Promise<Product[]> {
  if (!locale || products.length === 0) return products;

  const translations = await prisma.productTranslation.findMany({
    where: { locale, productId: { in: products.map((p) => p.id) } },
  });
  if (translations.length === 0) return products;

  const byId = new Map(translations.map((t) => [t.productId, t]));
  return products.map((product) => {
    const t = byId.get(product.id);
    if (!t) return product;
    return {
      ...product,
      name: t.name,
      unit: t.unit ?? product.unit,
      description: t.description ?? product.description,
      nutrition: t.nutrition ?? product.nutrition,
      origin: t.origin ?? product.origin,
    };
  });
}

/**
 * Translate Prisma's known request errors into transport-agnostic domain errors
 * so callers never branch on Prisma codes; every other error passes through.
 */
function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: the targeted row no longer exists (lost a race between a pre-write
    // existence check and the write).
    if (error.code === "P2025") return new NotFoundError("product", undefined, { cause: error });
  }
  return error;
}
