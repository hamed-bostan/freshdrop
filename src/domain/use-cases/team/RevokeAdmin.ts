import type { User } from "../../entities/User";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { AdminRevokeError } from "../../errors/AdminRevokeError";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Demote an admin back to a regular customer. The account itself is untouched —
 * their orders, addresses and profile survive; only dashboard access is withdrawn.
 *
 * Two refusals keep an owner from locking the team out with one click:
 *   - you can't revoke *yourself* (a slip on your own row is the common accident,
 *     and someone else should be the one to remove you);
 *   - you can't revoke the *last* admin, which would leave the dashboard
 *     reachable only through the `ADMIN_USER_IDS` break-glass env allowlist.
 */
export class RevokeAdmin {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, actorId: string): Promise<User> {
    if (id === actorId) {
      throw new AdminRevokeError("self", "You can't remove your own admin access.");
    }

    const target = await this.userRepo.getById(id);
    if (!target || target.role !== "admin") {
      throw new NotFoundError("admin", id);
    }

    const admins = await this.userRepo.listByRole("admin");
    if (admins.length <= 1) {
      throw new AdminRevokeError("lastAdmin", "You can't remove the last admin.");
    }

    return this.userRepo.setRole({ id: target.id, phone: target.phone, role: "customer" });
  }
}
