import type { ICategoryRepository } from "../../repositories/ICategoryRepository";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";

export class DeleteCategory {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly imageStorage: IImageStorageRepository,
  ) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new ValidationError("id", "Missing category id.");

    const existing = await this.categoryRepo.getById(id);
    if (!existing) throw new NotFoundError("category", id);

    await this.categoryRepo.delete(id);

    // Reclaim the now-orphaned icon (best-effort: never blocks the delete).
    await this.imageStorage.removeByUrl(existing.iconUrl);
  }
}
