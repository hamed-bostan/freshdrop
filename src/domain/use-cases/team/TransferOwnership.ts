import type { User } from "../../entities/User";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { AdminRevokeError } from "../../errors/AdminRevokeError";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Hand ownership of the store to another team member.
 *
 * Exactly one owner exists, so this is a swap rather than a grant: the target
 * becomes `owner` and the outgoing owner steps down to `admin` — they keep
 * running the store, they just stop being the account no peer can remove. That
 * also makes this the *only* way to change who the owner is, which is what makes
 * "the owner can't be removed" a safe rule instead of a trap.
 *
 * The two writes aren't in one transaction. A failure between them leaves two
 * owners, which is recoverable (either can transfer again) and strictly safer
 * than the alternative ordering's failure mode — zero owners, i.e. nobody who can
 * manage the team. Promote first, demote second, deliberately.
 */
export class TransferOwnership {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(targetId: string, actorId: string): Promise<User> {
    const actor = await this.userRepo.getById(actorId);

    // Targeting yourself is only meaningless if you already *are* the owner.
    // Otherwise it's a break-glass admin claiming the vacant seat — the bootstrap
    // path for a deployment that has no owner in the database yet. Refusing it
    // outright deadlocked that case: the only route to ownership was to hand it
    // to somebody else.
    if (targetId === actorId && actor?.role === "owner") {
      throw new AdminRevokeError("self", "You already own this store.");
    }

    const target = await this.userRepo.getById(targetId);
    if (!target) throw new NotFoundError("user", targetId);

    const promoted = await this.userRepo.setRole({
      id: target.id,
      phone: target.phone,
      role: "owner",
    });

    // Step the outgoing owner down. They may not hold the role in the database at
    // all — a break-glass admin bootstrapping the first owner has env-based access
    // and nothing to demote — so a missing row here is expected, not a failure.
    if (actor && actor.id !== promoted.id && actor.role === "owner") {
      await this.userRepo.setRole({ id: actor.id, phone: actor.phone, role: "admin" });
    }

    return promoted;
  }
}
