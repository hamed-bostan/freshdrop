import type { IFavoriteRepository } from "../../repositories/IFavoriteRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";

export class AddFavorite {
  constructor(
    private readonly favoriteRepo: IFavoriteRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(productId: string): Promise<void> {
    // Don't let a favorite point at a product that doesn't exist — surfaces as 404.
    const product = await this.productRepo.getPublishedById(productId);
    if (!product) throw new NotFoundError("product", productId);

    await this.favoriteRepo.addFavorite(productId);
  }
}
