import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { Product } from "../../entities/Product";
import type { IProductRepository, NewProduct } from "../../repositories/IProductRepository";
import { ValidationError } from "../../errors/ValidationError";

export class CreateProduct {
  constructor(
    private readonly productRepo: IProductRepository,
  ) {}

  /**
   * `actor` is the admin creating the product. Required, not optional: it's both
   * what opens the product's stock ledger with an entry saying who put the initial
   * units there, and what the activity log records. An optional actor would make
   * an unattributed product one forgotten argument away, which is the failure mode
   * the log exists to rule out.
   */
  async execute(input: NewProduct, actor: ActivityActor): Promise<Product> {
    // Last-resort domain guard behind the route's schema validation, so a direct
    // caller (seed script, importer) still can't bypass the invariants.
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

    // The entry is built here and written by the repository *inside* the
    // transaction that creates the product, so a product can't exist without the
    // record of who created it. The hook is a function of the persisted row
    // because the id it needs doesn't exist until the insert has run.
    return this.productRepo.create({ ...input, name }, actor, (created) => ({
      actorId: actor.id,
      actorName: actor.name,
      action: "product.created",
      entityType: "product",
      entityId: created.id,
      entityLabel: created.name,
      // A creation has no "before", so the diff records the values it started at
      // rather than an empty list — otherwise the entry says a product appeared
      // and nothing about what it was. Only the fields worth answering "what was
      // this set to?" about; the whole form would bury them.
      changes: [
        { field: "price", before: null, after: activityValue(created.price) },
        { field: "stockQuantity", before: null, after: activityValue(created.stockQuantity) },
      ],
    }));
  }
}
