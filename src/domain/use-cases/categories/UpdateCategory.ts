import type { Category } from "../../entities/Category";
import type { ICategoryRepository, NewCategory } from "../../repositories/ICategoryRepository";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";

export class UpdateCategory {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly imageStorage: IImageStorageRepository,
  ) {}

  async execute(id: string, input: NewCategory): Promise<Category> {
    if (!id) throw new Error("UpdateCategory: id is required.");
    const name = input.name.trim();
    const slug = input.slug.trim();
    if (!name) throw new Error("UpdateCategory: name is required.");
    if (!slug) throw new Error("UpdateCategory: slug is required.");
    if (!input.iconUrl) throw new Error("UpdateCategory: an icon image is required.");

    const previous = await this.categoryRepo.getById(id);
    const updated = await this.categoryRepo.update(id, { name, slug, iconUrl: input.iconUrl });

    // Reclaim the previous icon when it's been swapped out (best-effort).
    if (previous && previous.iconUrl !== updated.iconUrl) {
      await this.imageStorage.removeByUrl(previous.iconUrl);
    }

    return updated;
  }
}
