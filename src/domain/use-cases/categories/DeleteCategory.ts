import type { ICategoryRepository } from "../../repositories/ICategoryRepository";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";
import { ValidationError } from "../../errors/ValidationError";

export class DeleteCategory {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly imageStorage: IImageStorageRepository,
  ) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new ValidationError("id", "Missing category id.");

    const existing = await this.categoryRepo.getById(id);
    await this.categoryRepo.delete(id);

    // Reclaim the now-orphaned icon (best-effort: never blocks the delete).
    if (existing) await this.imageStorage.removeByUrl(existing.iconUrl);
  }
}
