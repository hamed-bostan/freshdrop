import type { Category } from "../../entities/Category";
import type { ICategoryRepository } from "../../repositories/ICategoryRepository";

export class GetCategoryBySlug {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  execute(slug: string): Promise<Category | null> {
    return this.categoryRepo.getBySlug(slug);
  }
}
