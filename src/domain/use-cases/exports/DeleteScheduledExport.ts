import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";

/** The schedules management list's "Delete" — removes the standing rule. Jobs it already produced are untouched. */
export class DeleteScheduledExport {
  constructor(private readonly schedules: IScheduledExportRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.schedules.getById(id);
    if (!existing) throw new NotFoundError("scheduled export", id);
    await this.schedules.remove(id);
  }
}
