import type { Category } from "../../entities/Category";
import type { ICategoryRepository, NewCategory } from "../../repositories/ICategoryRepository";

export class CreateCategory {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  execute(input: NewCategory): Promise<Category> {
    const name = input.name.trim();
    const slug = input.slug.trim();
    if (!name) throw new Error("CreateCategory: name is required.");
    if (!slug) throw new Error("CreateCategory: slug is required.");
    if (!input.iconUrl) throw new Error("CreateCategory: an icon image is required.");
    return this.categoryRepo.create({ name, slug, iconUrl: input.iconUrl });
  }
}
