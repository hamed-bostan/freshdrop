import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/**
 * Permanently delete the signed-in user's own account. Always scoped to the
 * caller's own id (never another user's) — the route handler passes the
 * session id, never one read from the request body.
 */
export class DeleteAccount {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    await this.userRepository.deleteAccount(userId);
  }
}
