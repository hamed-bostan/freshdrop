import type { Order } from "../../entities/Order";
import type { IProductRepository } from "../../repositories/IProductRepository";

/**
 * Overlay the current localized product name onto an order's line items (and any
 * substitution replacement) for display in `locale`, falling back to the stored
 * snapshot when the product no longer exists. The order stays a faithful record:
 * the price / quantity / substitution-refund snapshot is untouched — only the
 * display *name* is re-resolved to the reader's language, so an order placed in one
 * locale reads correctly in another and legacy/seeded orders localize too. No-op for
 * the default locale (returns the stored snapshots).
 */
export async function localizeOrderItems(
  orders: Order[],
  products: IProductRepository,
  locale?: string,
): Promise<Order[]> {
  if (!locale || orders.length === 0) return orders;

  const catalog = await products.getAll(locale);
  const nameById = new Map(catalog.map((product) => [product.id, product.name]));

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const replacement = item.substitution?.replacement;
      return {
        ...item,
        name: nameById.get(item.productId) ?? item.name,
        substitution:
          item.substitution && replacement
            ? {
                ...item.substitution,
                replacement: {
                  ...replacement,
                  name: nameById.get(replacement.productId) ?? replacement.name,
                },
              }
            : item.substitution,
      };
    }),
  }));
}
