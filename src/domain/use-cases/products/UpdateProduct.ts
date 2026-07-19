import type { ActivityActor } from "../../entities/ActivityEntry";
import { diffFields } from "../../entities/ActivityEntry";
import type { Product } from "../../entities/Product";
import type { IProductRepository, NewProduct } from "../../repositories/IProductRepository";
import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "../../repositories/IStockAlertNotifier";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";
import { FulfillStockAlerts } from "./FulfillStockAlerts";
import { productSnapshot } from "./productActivity";

export class UpdateProduct {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly stockAlerts: IStockAlertRepository,
    private readonly notifier: IStockAlertNotifier,
  ) {}

  /**
   * `actor` is the admin saving the form, and is required. It's passed through to
   * the repository, which records a `correction` in the stock ledger when the form
   * moved `stockQuantity` — the edit form is a stock-changing path like any other,
   * and an unexplained jump in the history would be exactly the thing the ledger
   * exists to prevent — and it attributes the activity entry this writes.
   */
  async execute(id: string, input: NewProduct, actor: ActivityActor): Promise<Product> {
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

    // The entry is written by the repository inside the transaction that saves the
    // product, so the two commit together. The hook diffs against the row the
    // write actually produced — not against the form's initial values, which are
    // the client's idea of "before" and may be minutes stale.
    //
    // Returning `null` for an unchanged save is what keeps the log a record of
    // changes rather than of clicks: an empty diff would be an entry saying
    // someone opened the form.
    const updated = await this.productRepo.update(id, { ...input, name }, actor, (saved) => {
      const changes = diffFields(productSnapshot(existing), productSnapshot(saved));
      if (changes.length === 0) return null;
      return {
        actorId: actor.id,
        actorName: actor.name,
        action: "product.updated",
        entityType: "product",
        entityId: saved.id,
        entityLabel: saved.name,
        changes,
      };
    });

    // A restock (out of stock → available again) fulfils any back-in-stock alerts.
    if (existing.stockQuantity <= 0 && updated.stockQuantity > 0) {
      await new FulfillStockAlerts(this.stockAlerts, this.notifier).execute(updated);
    }

    return updated;
  }
}
