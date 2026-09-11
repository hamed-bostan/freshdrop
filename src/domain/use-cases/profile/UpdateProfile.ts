import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

import type { User } from "../../entities/User";
import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";

/** The profile fields a user may change. `email`/`avatarUrl` clear when omitted/blank. */
export type UpdateProfileInput = {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

export class UpdateProfile {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly imageStorage: IImageStorageRepository,
  ) {}

  async execute(id: string, input: UpdateProfileInput): Promise<User> {
    if (!id) throw new ValidationError("id", "Missing user id.");

    const name = input.name.trim();
    if (!name) throw new ValidationError("name", "Name is required.");

    // Normalize "empty" to null so the DB stores absence, not an empty string.
    const email = input.email?.trim() ? input.email.trim() : null;
    const avatarUrl = input.avatarUrl?.trim() ? input.avatarUrl.trim() : null;

    const previous = await this.userRepo.getById(id);
    if (!previous) throw new NotFoundError("user", id);

    const updated = await this.userRepo.update(id, { name, email, avatarUrl });

    // Reclaim the previous avatar when it's been swapped out or removed (best-effort).
    if (previous.avatarUrl && previous.avatarUrl !== updated.avatarUrl) {
      await this.imageStorage.removeByUrl(previous.avatarUrl);
    }

    return updated;
  }
}
