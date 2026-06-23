import type { Product } from "../../entities/Product";
import type { IFavoriteRepository } from "../../repositories/IFavoriteRepository";

export class GetFavorites {
  constructor(private readonly favoriteRepo: IFavoriteRepository) {}

  execute(): Promise<Product[]> {
    return this.favoriteRepo.getFavorites();
  }
}
