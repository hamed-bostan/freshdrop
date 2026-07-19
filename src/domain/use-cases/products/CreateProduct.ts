import type { Product } from "../../entities/Product";
import type {
  IProductRepository,
  NewProduct,
  StockMovementActor,
} from "../../repositories/IProductRepository";
import { ValidationError } from "../../errors/ValidationError";

export class CreateProduct {
  constructor(private readonly productRepo: IProductRepository) {}

  /**
   * `actor` is the admin creating the product. Passed through so a product born
   * with units on hand opens its ledger with an entry saying who put them there,
   * rather than a history that starts mid-air at a level nobody accounted for.
   */
  async execute(input: NewProduct, actor?: StockMovementActor): Promise<Product> {
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

    return this.productRepo.create({ ...input, name }, actor);
  }
}
