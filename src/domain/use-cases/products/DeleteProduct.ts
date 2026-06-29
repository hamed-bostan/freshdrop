import type { IProductRepository } from "../../repositories/IProductRepository";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";

export class DeleteProduct {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new ValidationError("id", "Missing product id.");

    const existing = await this.productRepo.getById(id);
    if (!existing) throw new NotFoundError("product", id);

    await this.productRepo.delete(id);
  }
}
