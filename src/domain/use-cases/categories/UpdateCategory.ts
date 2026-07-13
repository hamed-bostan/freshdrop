import type { Category } from "../../entities/Category";
import type { ICategoryRepository, NewCategory } from "../../repositories/ICategoryRepository";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";

export class UpdateCategory {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly imageStorage: IImageStorageRepository,
  ) {}

  async execute(id: string, input: NewCategory): Promise<Category> {
    if (!id) throw new ValidationError("id", "Missing category id.");
    const name = input.name.trim();
    const slug = input.slug.trim();
    if (!name) throw new ValidationError("name", "Name is required.");
    if (!slug) throw new ValidationError("slug", "Slug is required.");
    if (!input.iconUrl) throw new ValidationError("iconUrl", "An icon image is required.");

    // Slug uniqueness is this use-case's invariant: reject a slug already owned by
    // a *different* category (renaming to your own current slug is fine). The DB's
    // unique constraint still guards the check-to-update race — that path surfaces
    // as the same UniqueConstraintError from the repository.
    const clash = await this.categoryRepo.getBySlug(slug);
    if (clash && clash.id !== id) throw new UniqueConstraintError(["slug"]);

    const previous = await this.categoryRepo.getById(id);
    if (!previous) throw new NotFoundError("category", id);

    const updated = await this.categoryRepo.update(id, {
      name,
      slug,
      iconUrl: input.iconUrl,
      translations: input.translations,
    });

    // Reclaim the previous icon when it's been swapped out (best-effort).
    if (previous.iconUrl !== updated.iconUrl) {
      await this.imageStorage.removeByUrl(previous.iconUrl);
    }

    return updated;
  }
}
