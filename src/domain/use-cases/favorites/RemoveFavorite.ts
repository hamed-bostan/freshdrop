import type { IFavoriteRepository } from "../../repositories/IFavoriteRepository";

export class RemoveFavorite {
  constructor(private readonly favoriteRepo: IFavoriteRepository) {}

  execute(productId: string): Promise<void> {
    return this.favoriteRepo.removeFavorite(productId);
  }
}
