import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetProductById {
  constructor(private readonly productRepo: IProductRepository) {}

  execute(id: string, locale?: string): Promise<Product | null> {
    return this.productRepo.getById(id, locale);
  }
}
