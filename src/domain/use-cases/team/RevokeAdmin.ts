import { isDashboardRole, type User } from "../../entities/User";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { AdminRevokeError } from "../../errors/AdminRevokeError";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Demote a team member back to a regular customer. The account itself is
 * untouched — their orders, addresses and profile survive; only dashboard access
 * is withdrawn.
 *
 * Two refusals:
 *   - you can't revoke *yourself* (a slip on your own row is the common accident,
 *     and someone else should be the one to remove you);
 *   - you can't revoke the *owner*, who must hand ownership on first (see
 *     `TransferOwnership`).
 *
 * There is deliberately no "last admin" rule any more. It existed to stop the
 * dashboard becoming unreachable, and the owner now guarantees that: only an
 * owner can revoke, and an owner can't revoke themselves, so someone with access
 * always remains. That invariant is far easier to hold than a count.
 */
export class RevokeAdmin {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, actorId: string): Promise<User> {
    if (id === actorId) {
      throw new AdminRevokeError("self", "You can't remove your own access.");
    }

    const target = await this.userRepo.getById(id);
    if (!target || !isDashboardRole(target.role)) {
      throw new NotFoundError("team member", id);
    }

    if (target.role === "owner") {
      throw new AdminRevokeError(
        "owner",
        "You can't remove the owner. Transfer ownership to someone else first.",
      );
    }

    return this.userRepo.setRole({ id: target.id, phone: target.phone, role: "customer" });
  }
}
