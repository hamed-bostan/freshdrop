import type { ICategoryRepository } from "../../repositories/ICategoryRepository";

export class DeleteCategory {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  execute(id: string): Promise<void> {
    if (!id) throw new Error("DeleteCategory: id is required.");
    return this.categoryRepo.delete(id);
  }
}
