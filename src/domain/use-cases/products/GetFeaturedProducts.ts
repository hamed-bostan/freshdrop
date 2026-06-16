import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetFeaturedProducts {
  constructor(private readonly productRepo: IProductRepository) {}

  execute(): Promise<Product[]> {
    return this.productRepo.getFeatured();
  }
}
