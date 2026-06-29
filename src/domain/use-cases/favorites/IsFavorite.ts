import type { IFavoriteRepository } from "../../repositories/IFavoriteRepository";

export class IsFavorite {
  constructor(private readonly favoriteRepo: IFavoriteRepository) {}

  execute(productId: string): Promise<boolean> {
    return this.favoriteRepo.isFavorite(productId);
  }
}
