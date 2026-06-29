import { Prisma } from "@prisma/client";
import type { Product } from "@/src/domain/entities/Product";
import type { IProductRepository, NewProduct } from "@/src/domain/repositories/IProductRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";

/** How many related products the detail screen's "Similar To This Item" rail shows. */
const SIMILAR_LIMIT = 6;

/**
 * Products backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toProduct);
  }

  async getById(id: string): Promise<Product | null> {
    const row = await prisma.product.findUnique({ where: { id } });
    return row ? toProduct(row) : null;
  }

  async getFeatured(): Promise<Product[]> {
    const rows = await prisma.product.findMany({ where: { isFeatured: true }, orderBy: { createdAt: "asc" } });
    return rows.map(toProduct);
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({ where: { categoryId }, orderBy: { createdAt: "asc" } });
    return rows.map(toProduct);
  }

  async getSpecialOffers(): Promise<Product[]> {
    // "Special offers" are products carrying a badge — mirrors the mock's rule.
    const rows = await prisma.product.findMany({ where: { badge: { not: null } }, orderBy: { createdAt: "asc" } });
    return rows.map(toProduct);
  }

  async getSimilar(productId: string): Promise<Product[]> {
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

    return [...sameCategory, ...others].slice(0, SIMILAR_LIMIT).map(toProduct);
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
}

/** The persisted columns a Product maps from (DB-only timestamps dropped). */
type ProductRow = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  badge: string | null;
  unit: string | null;
  description: string | null;
  nutrition: string | null;
  origin: string | null;
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
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    isFeatured: row.isFeatured,
    badge: row.badge ?? undefined,
    unit: row.unit ?? undefined,
    description: row.description ?? undefined,
    nutrition: row.nutrition ?? undefined,
    origin: row.origin ?? undefined,
  };
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
