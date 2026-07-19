import { Prisma } from "@prisma/client";
import type { Product } from "@/src/domain/entities/Product";
import type { AdminProductFilters, AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import { DEFAULT_ADMIN_PRODUCT_DIRECTION } from "@/src/domain/entities/AdminProductFilters";
import { createPage, toSkipTake, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import { LOW_STOCK_THRESHOLD } from "@/src/domain/entities/stock";
import type { ProductFilters, ProductSort } from "@/src/domain/entities/ProductFilters";
import type {
  IProductRepository,
  NewProduct,
  ProductTranslationInput,
  StockAdjustment,
  StockMovementActor,
  StockMovementContext,
} from "@/src/domain/repositories/IProductRepository";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { InsufficientStockError, type StockShortfall } from "@/src/domain/errors/InsufficientStockError";
import { prisma } from "@/src/infrastructure/prisma/client";
import { recordAudit } from "./writeActivityEntry";

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

  async getByIds(ids: readonly string[], locale?: string): Promise<Product[]> {
    // An empty id list would otherwise become `IN ()` — a query for nothing that
    // still costs a round trip.
    if (ids.length === 0) return [];
    const rows = await prisma.product.findMany({ where: { id: { in: [...ids] } } });
    return localizeProducts(rows.map(toProduct), locale);
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

  async listPage(
    filters: AdminProductFilters,
    page: PageRequest<AdminProductSort>,
    locale?: string,
  ): Promise<Page<Product>> {
    const where = adminWhere(filters);
    const { skip, take } = toSkipTake(page);

    // One transaction so the rows and the count are read from the same snapshot.
    // Read separately, a concurrent create between them yields a total that
    // doesn't match the page — a pager that offers an empty last page.
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy: adminOrderBy(page), skip, take }),
      prisma.product.count({ where }),
    ]);

    return createPage(await localizeProducts(rows.map(toProduct), locale), total, page);
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

  async create(input: NewProduct, actor?: StockMovementActor, audit?: AuditHook<Product>): Promise<Product> {
    // `translations` isn't a `products` column — persist it into the side table.
    const { translations, ...data } = input;
    try {
      // The row and its opening ledger entry commit together: a product that
      // starts with units on hand should never have a history that begins with a
      // level nobody put there.
      const row = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({ data });
        if (created.stockQuantity > 0) {
          await tx.stockMovement.create({
            data: movementRow(created.id, created.stockQuantity, created.stockQuantity, {
              reason: "correction",
              actor,
            }),
          });
        }
        // Inside the transaction, so the audit entry and the product it records
        // commit together — see `recordAudit`.
        await recordAudit(tx, toProduct(created), audit);
        return created;
      });
      await replaceProductTranslations(row.id, translations);
      return toProduct(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async update(id: string, input: NewProduct, actor?: StockMovementActor, audit?: AuditHook<Product>): Promise<Product> {
    const { translations, ...data } = input;
    try {
      // The edit form can move stock like any other field, so the update and the
      // ledger entry explaining the move are one transaction — the form is not a
      // back door around the ledger. The previous level is read inside it so the
      // delta is computed against what the write actually replaced.
      const row = await prisma.$transaction(async (tx) => {
        const before = await tx.product.findUnique({ where: { id }, select: { stockQuantity: true } });
        const updated = await tx.product.update({ where: { id }, data });

        const delta = updated.stockQuantity - (before?.stockQuantity ?? 0);
        if (delta !== 0) {
          await tx.stockMovement.create({
            data: movementRow(id, delta, updated.stockQuantity, { reason: "correction", actor }),
          });
        }
        await recordAudit(tx, toProduct(updated), audit);
        return updated;
      });
      await replaceProductTranslations(row.id, translations);
      return toProduct(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async adjustStock(
    productId: string,
    delta: number,
    context: StockMovementContext,
    audit?: AuditHook<Product>,
  ): Promise<Product> {
    if (delta === 0) {
      // Nothing moved, so there is nothing to record. Reading the row back keeps
      // the return contract ("the product as it now stands") without writing an
      // entry that would explain nothing.
      const current = await prisma.product.findUnique({ where: { id: productId } });
      if (!current) throw new NotFoundError("product", productId);
      return toProduct(current);
    }

    return prisma.$transaction(async (tx) => {
      // A conditional `updateMany` guarded by `stock_quantity >= -delta` for
      // removals: the guard and the write are one atomic statement, so a removal
      // racing a checkout can't drive stock negative between the read and the
      // write. Additions need no guard.
      const guard: Prisma.ProductWhereInput =
        delta < 0 ? { id: productId, stockQuantity: { gte: -delta } } : { id: productId };

      const result = await tx.product.updateMany({
        where: guard,
        data: { stockQuantity: { increment: delta } },
      });

      if (result.count === 0) {
        // Either the product is gone, or the removal is larger than what's on
        // hand. Read the current level to tell those apart and say how many are
        // actually there.
        const current = await tx.product.findUnique({
          where: { id: productId },
          select: { stockQuantity: true, name: true },
        });
        if (!current) throw new NotFoundError("product", productId);
        throw new InsufficientStockError([
          {
            productId,
            name: current.name,
            available: current.stockQuantity,
            requested: -delta,
          },
        ]);
      }

      const updated = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      await tx.stockMovement.create({
        data: movementRow(productId, delta, updated.stockQuantity, context),
      });
      const product = toProduct(updated);
      await recordAudit(tx, product, audit);
      return product;
    });
  }

  async getTranslations(productId: string): Promise<ProductTranslationInput[]> {
    const rows = await prisma.productTranslation.findMany({
      where: { productId },
      orderBy: { locale: "asc" },
    });
    return rows.map((row) => ({
      locale: row.locale,
      name: row.name,
      unit: row.unit ?? undefined,
      description: row.description ?? undefined,
      nutrition: row.nutrition ?? undefined,
      origin: row.origin ?? undefined,
    }));
  }

  async delete(id: string, audit?: AuditHook<void>): Promise<void> {
    try {
      // Transactional even though it is a single delete: the audit entry is the
      // only record the product ever existed, so it must not be able to go missing
      // while the row it describes is removed.
      await prisma.$transaction(async (tx) => {
        await tx.product.delete({ where: { id } });
        await recordAudit(tx, undefined, audit);
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async decrementStock(lines: readonly StockAdjustment[], context: StockMovementContext): Promise<void> {
    if (lines.length === 0) return;

    // One interactive transaction so all lines commit together or not at all.
    // Each decrement is a conditional `updateMany` guarded by `stockQuantity >=
    // quantity`: the guard and the write are a single atomic statement, so two
    // concurrent orders can't both read the same stock and oversell — the loser's
    // guard fails (0 rows) and we roll the whole order back. Throwing out of the
    // callback aborts the transaction, undoing any decrements already applied.
    const merged = mergeLines(lines);

    await prisma.$transaction(async (tx) => {
      const shortfalls: StockShortfall[] = [];
      const applied: StockAdjustment[] = [];

      for (const line of merged) {
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
          continue;
        }

        applied.push(line);
      }

      // Before the ledger write, so a short order does no work it's about to
      // roll back — and so the failure path costs exactly what it did before.
      if (shortfalls.length > 0) throw new InsufficientStockError(shortfalls);

      await recordMovements(
        tx,
        applied.map((line) => ({ productId: line.productId, delta: -line.quantity })),
        context,
      );
    });
  }

  async incrementStock(lines: readonly StockAdjustment[], context: StockMovementContext): Promise<void> {
    if (lines.length === 0) return;

    // The inverse of `decrementStock`: returning stock always succeeds, so there's
    // no guard and no shortfall path. One interactive transaction keeps the lines
    // and their ledger entries atomic; `updateMany` silently matches nothing for a
    // since-deleted product (count 0), so a missing product is skipped rather than
    // erroring — and writes no entry, because no stock moved.
    const merged = mergeLines(lines);

    await prisma.$transaction(async (tx) => {
      const applied: StockAdjustment[] = [];

      for (const line of merged) {
        const result = await tx.product.updateMany({
          where: { id: line.productId },
          data: { stockQuantity: { increment: line.quantity } },
        });
        if (result.count > 0) applied.push(line);
      }

      await recordMovements(
        tx,
        applied.map((line) => ({ productId: line.productId, delta: line.quantity })),
        context,
      );
    });
  }
}

/**
 * Collapse lines to one per product, ordered by product id.
 *
 * Two jobs, both about what happens under concurrency. Ordering makes every
 * caller take row locks in the same sequence, so two orders sharing products
 * can't each hold what the other is waiting for — the classic deadlock, which
 * only shows up under the load you least want it to. Merging makes a repeated
 * product one lock and one ledger entry instead of two of each; "this order took
 * 5" is also the truthful entry, where two rows of 2 and 3 invite the reader to
 * wonder what happened in between.
 */
function mergeLines(lines: readonly StockAdjustment[]): StockAdjustment[] {
  const byProduct = new Map<string, StockAdjustment>();
  for (const line of lines) {
    const existing = byProduct.get(line.productId);
    if (existing) existing.quantity += line.quantity;
    else byProduct.set(line.productId, { ...line });
  }
  return [...byProduct.values()].sort((a, b) => a.productId.localeCompare(b.productId));
}

/** A product's signed change, once its row has already been updated. */
type AppliedMovement = { productId: string; delta: number };

/**
 * Write the ledger entries for a batch of movements: one read for the levels
 * they left behind, one insert for the rows.
 *
 * Batched rather than a read-and-insert per line because this runs inside the
 * checkout transaction, holding a row lock on every product in the cart. Two
 * round-trips per line would scale the time those locks are held with the size of
 * the cart, turning a busy shop's large orders into the ones most likely to
 * collide — so the ledger's cost stays flat instead.
 */
async function recordMovements(
  tx: Prisma.TransactionClient,
  movements: readonly AppliedMovement[],
  context: StockMovementContext,
): Promise<void> {
  if (movements.length === 0) return;

  const rows = await tx.product.findMany({
    where: { id: { in: movements.map((movement) => movement.productId) } },
    select: { id: true, stockQuantity: true },
  });
  const quantityAfter = new Map(rows.map((row) => [row.id, row.stockQuantity]));

  await tx.stockMovement.createMany({
    data: movements.flatMap((movement) => {
      // A product that vanished between its update and this read has no level to
      // record. It can't happen inside the transaction that just locked the row,
      // but the map lookup has to be total either way.
      const after = quantityAfter.get(movement.productId);
      if (after === undefined) return [];
      return [movementRow(movement.productId, movement.delta, after, context)];
    }),
  });
}

/**
 * Build the ledger row for one movement. Shared by every write path so the
 * attribution columns are filled the same way each time: an operator's adjustment
 * carries the actor's id and their name at the time, an order-driven one carries
 * the order.
 */
function movementRow(
  productId: string,
  delta: number,
  quantityAfter: number,
  context: StockMovementContext,
): Prisma.StockMovementUncheckedCreateInput {
  return {
    productId,
    delta,
    quantityAfter,
    reason: context.reason,
    note: context.note ?? null,
    actorId: context.actor?.id ?? null,
    actorName: context.actor?.name ?? null,
    orderId: context.orderId ?? null,
  };
}

/** Map a sort option to a Prisma `orderBy`; defaults to alphabetical by name. */
/**
 * `WHERE` for the catalog-management list. Unlike the storefront's search, an
 * empty filter is legitimate and matches everything.
 *
 * The text term matches the canonical name/description only — the admin list is a
 * management view of the base rows, and an operator searching it is looking for
 * the row they'd edit. (The storefront search widens to translations because a
 * shopper types in their own language.)
 */
function adminWhere(filters: AdminProductFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.query) {
    and.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        { description: { contains: filters.query, mode: "insensitive" } },
      ],
    });
  }
  if (filters.categoryId) and.push({ categoryId: filters.categoryId });

  // Bounds mirror `getStockStatus` exactly, so a row the storefront calls "low"
  // is the same row this filter returns for `?stock=low`.
  if (filters.stock === "out") and.push({ stockQuantity: { lte: 0 } });
  if (filters.stock === "low") and.push({ stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } });
  if (filters.stock === "in") and.push({ stockQuantity: { gt: LOW_STOCK_THRESHOLD } });
  // Low *and* out together — the union of the two above, which is exactly what the
  // overview's "needs restocking" tile counts.
  if (filters.stock === "needsRestock") and.push({ stockQuantity: { lte: LOW_STOCK_THRESHOLD } });

  return and.length ? { AND: and } : {};
}

/**
 * `ORDER BY` for the management list. Ordering is on the *canonical* columns even
 * when the rows are localized for display: translations live in a side table with
 * no relation to order through, and sorting the page after it's been cut would
 * only order the slice, not the catalog.
 */
function adminOrderBy(page: PageRequest<AdminProductSort>): Prisma.ProductOrderByWithRelationInput {
  const direction = page.direction ?? DEFAULT_ADMIN_PRODUCT_DIRECTION;
  switch (page.sort) {
    case "name":
      return { name: direction };
    case "price":
      return { price: direction };
    case "stock":
      return { stockQuantity: direction };
    default:
      return { createdAt: direction };
  }
}

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
 * Persist a product's per-locale translations to the side table. `undefined` leaves
 * them untouched (e.g. a caller that doesn't manage translations); a list replaces
 * the set — locales absent from it are deleted (so `[]` clears all), the rest upserted.
 */
async function replaceProductTranslations(
  productId: string,
  translations?: ProductTranslationInput[],
): Promise<void> {
  if (translations === undefined) return;

  const locales = translations.map((t) => t.locale);
  const where: Prisma.ProductTranslationWhereInput = { productId };
  // Remove locales no longer present (all of them when the list is empty).
  if (locales.length > 0) where.locale = { notIn: locales };

  // One atomic batch — the delete and the upserts land together or not at all, so a
  // failure mid-way can't leave the translation set half-replaced.
  await prisma.$transaction([
    prisma.productTranslation.deleteMany({ where }),
    ...translations.map((t) => {
      const fields = {
        name: t.name,
        unit: t.unit ?? null,
        description: t.description ?? null,
        nutrition: t.nutrition ?? null,
        origin: t.origin ?? null,
      };
      return prisma.productTranslation.upsert({
        where: { productId_locale: { productId, locale: t.locale } },
        create: { productId, locale: t.locale, ...fields },
        update: fields,
      });
    }),
  ]);
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
