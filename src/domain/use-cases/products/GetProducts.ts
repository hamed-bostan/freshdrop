import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";

export class GetProducts {
  constructor(private readonly productRepo: IProductRepository) {}

  execute(): Promise<Product[]> {
    return this.productRepo.getAll();
  }
}
