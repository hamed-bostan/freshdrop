import type { Product } from "../../entities/Product";
import type { IProductRepository, NewProduct } from "../../repositories/IProductRepository";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";

export class UpdateProduct {
  constructor(private readonly productRepo: IProductRepository) {}

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

    const existing = await this.productRepo.getById(id);
    if (!existing) throw new NotFoundError("product", id);

    return this.productRepo.update(id, { ...input, name });
  }
}
