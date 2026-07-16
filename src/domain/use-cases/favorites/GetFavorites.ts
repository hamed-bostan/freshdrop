import type { Product } from "../../entities/Product";
import type { IFavoriteRepository } from "../../repositories/IFavoriteRepository";

export class GetFavorites {
  constructor(private readonly favoriteRepo: IFavoriteRepository) {}

  /** `locale` selects the language for the products' user-facing text. */
  execute(locale?: string): Promise<Product[]> {
    return this.favoriteRepo.getFavorites(locale);
  }
}
