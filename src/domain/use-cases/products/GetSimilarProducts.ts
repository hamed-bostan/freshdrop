import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetSimilarProducts {
  constructor(private readonly productRepo: IProductRepository) {}

  execute(productId: string, locale?: string): Promise<Product[]> {
    return this.productRepo.getSimilar(productId, locale);
  }
}
