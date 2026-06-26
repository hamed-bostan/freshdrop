import type { Category } from "../../entities/Category";
import type { ICategoryRepository, NewCategory } from "../../repositories/ICategoryRepository";

export class UpdateCategory {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  execute(id: string, input: NewCategory): Promise<Category> {
    if (!id) throw new Error("UpdateCategory: id is required.");
    const name = input.name.trim();
    const slug = input.slug.trim();
    if (!name) throw new Error("UpdateCategory: name is required.");
    if (!slug) throw new Error("UpdateCategory: slug is required.");
    if (!input.iconUrl) throw new Error("UpdateCategory: an icon image is required.");
    return this.categoryRepo.update(id, { name, slug, iconUrl: input.iconUrl });
  }
}
