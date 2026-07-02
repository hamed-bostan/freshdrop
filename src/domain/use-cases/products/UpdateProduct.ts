import type { Product } from "../../entities/Product";
import type { IProductRepository, NewProduct } from "../../repositories/IProductRepository";
import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "../../repositories/IStockAlertNotifier";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";

export class UpdateProduct {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly stockAlerts: IStockAlertRepository,
    private readonly notifier: IStockAlertNotifier,
  ) {}

  async execute(id: string, input: NewProduct): Promise<Product> {
    if (!id) throw new ValidationError("id", "Missing product id.");
    const name = input.name.trim();
    if (!name) throw new ValidationError("name", "Name is required.");
    if (!input.categoryId) throw new ValidationError("categoryId", "Choose a category.");
    if (!(input.price > 0)) throw new ValidationError("price", "Price must be greater than 0.");
    if (input.originalPrice != null && input.originalPrice <= input.price) {
      throw new ValidationError("originalPrice", "Original price must be higher than the price.");
    }
    if (!input.imageUrl) throw new ValidationError("imageUrl", "A product image is required.");
    if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
      throw new ValidationError("stockQuantity", "Stock must be a whole number of 0 or more.");
    }

    const existing = await this.productRepo.getById(id);
    if (!existing) throw new NotFoundError("product", id);

    const updated = await this.productRepo.update(id, { ...input, name });

    // A restock (out of stock → available again) fulfils any back-in-stock alerts.
    if (existing.stockQuantity <= 0 && updated.stockQuantity > 0) {
      await this.fulfillStockAlerts(updated);
    }

    return updated;
  }

  /**
   * Notify the product's back-in-stock subscribers, then clear them. Best-effort:
   * the product update has already committed, so a notifier failure is logged, not
   * rethrown — a delivery hiccup must never fail the admin's save or the response.
   */
  private async fulfillStockAlerts(product: Product): Promise<void> {
    try {
      const subscriberIds = await this.stockAlerts.listSubscriberIds(product.id);
      if (subscriberIds.length === 0) return;
      await this.notifier.notifyRestocked(product, subscriberIds);
      await this.stockAlerts.clearForProduct(product.id);
    } catch (error) {
      console.error(`Failed to fulfill stock alerts for product ${product.id}:`, error);
    }
  }
}
