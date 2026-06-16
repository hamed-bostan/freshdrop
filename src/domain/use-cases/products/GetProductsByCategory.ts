import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetProductsByCategory {
  constructor(private readonly productRepo: IProductRepository) {}

  execute(categoryId: string): Promise<Product[]> {
    return this.productRepo.getByCategory(categoryId);
  }
}
