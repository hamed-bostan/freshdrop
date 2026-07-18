import type { User } from "../../entities/User";
import type { IUserRepository } from "../../repositories/IUserRepository";
import type { ITeamNotifier } from "../../repositories/ITeamNotifier";
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
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly notifier?: ITeamNotifier,
  ) {}

  async execute(targetId: string, actorId: string, dashboardUrl?: string): Promise<User> {
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

    // Read the incumbents *before* promoting, so the new owner isn't in the set
    // about to be stepped down.
    const incumbents = await this.userRepo.listByRoles(["owner"]);

    const promoted = await this.userRepo.setRole({
      id: target.id,
      phone: target.phone,
      role: "owner",
    });

    // Step down whoever currently holds the role — not merely the caller. Those
    // differ whenever a break-glass admin transfers: their access comes from the
    // environment, so they may hold no role at all while someone else is owner,
    // and demoting only the caller left two owners behind. Written as "demote
    // every owner that isn't the target" so it also repairs a database that has
    // somehow ended up with more than one.
    const steppedDown: User[] = [];
    for (const incumbent of incumbents) {
      if (incumbent.id === promoted.id) continue;
      steppedDown.push(
        await this.userRepo.setRole({
          id: incumbent.id,
          phone: incumbent.phone,
          role: "admin",
        }),
      );
    }

    // Best-effort, and after every write. Both sides are told: gaining ownership
    // is worth confirming, and losing it is worth *knowing* — this can be taken
    // by anyone with break-glass access, so the outgoing owner shouldn't have to
    // discover it by noticing their own badge changed.
    if (this.notifier && dashboardUrl) {
      const recipient = (user: User) => ({
        name: user.name,
        phone: user.phone,
        email: user.email,
      });

      // Only announce a promotion that actually changed something — repairing a
      // database with several owners re-promotes someone who already held it.
      if (target.role !== "owner") {
        await this.notifier.ownershipReceived(recipient(promoted), dashboardUrl);
      }
      for (const former of steppedDown) {
        await this.notifier.ownershipLost(recipient(former), promoted.name, dashboardUrl);
      }
    }

    return promoted;
  }
}
