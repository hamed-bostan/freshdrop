import { PLACEHOLDER_USER_NAME, type User } from "../../entities/User";
import { isPlausiblePhone, normalizePhone } from "../../entities/Phone";
import type { IUserRepository } from "../../repositories/IUserRepository";
import type { ITeamNotifier } from "../../repositories/ITeamNotifier";
import { ValidationError } from "../../errors/ValidationError";

/** Who to promote, and where to tell them about it. */
export type GrantAdminCommand = {
  /** The number they sign in with — their identity, and what the grant binds to. */
  phone: string;
  /** Optional contact address, used to email the invitation (and saved on the profile). */
  email?: string | null;
};

/**
 * Promote the holder of a phone number to admin, then tell them.
 *
 * The phone *is* the invitation. Because a user's id is their normalized phone
 * and sign-in is OTP on that number, granting the role to a number is equivalent
 * to sending an invite that only its owner can accept: nobody reaches the
 * dashboard without proving possession of the phone via OTP. That removes the
 * usual emailed-token dance (generate, deliver, expire, redeem) along with the
 * window in which a leaked token is worth stealing.
 *
 * The email address is therefore a *delivery channel*, not an identity: it says
 * where to send the "you have access now" note. A typo'd address means an
 * undelivered courtesy, not a stranger with admin rights.
 *
 * Idempotent, and safe to run before the person has ever signed in — the row
 * they'd be given at first sign-in is simply written early, with a placeholder
 * name they overwrite when they complete their profile. `GetOrCreateUser` finds
 * that existing row on their first sign-in and leaves the role intact.
 */
export class GrantAdmin {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly notifier?: ITeamNotifier,
  ) {}

  async execute(input: GrantAdminCommand, actorId: string, signInUrl?: string): Promise<User> {
    const id = normalizePhone(input.phone);

    if (!isPlausiblePhone(input.phone)) {
      throw new ValidationError("phone", "Enter a valid phone number.");
    }

    const email = input.email?.trim() || null;
    // Whether this grant actually changes anything decides both whether an
    // invitation goes out and whether it's recorded. Re-granting someone who is
    // already an admin is a harmless no-op on the row, but mailing them "you've
    // been given access" a second time is not — and the log tracks changes, not
    // clicks.
    const [existing, actor] = await Promise.all([
      this.userRepo.getById(id),
      this.userRepo.getById(actorId),
    ]);
    const alreadyAdmin = existing?.role === "admin";

    const [user] = await this.userRepo.applyRoleChanges({
      assignments: [{ id, phone: input.phone.trim(), role: "admin", email }],
      entries: alreadyAdmin
        ? []
        : [
            {
              userId: id,
              // The row may not exist yet, in which case it's about to be created
              // under the placeholder — the same name the entry should carry.
              userName: existing?.name ?? PLACEHOLDER_USER_NAME,
              actorId,
              actorName: actor?.name ?? actorId,
              fromRole: existing?.role ?? "customer",
              toRole: "admin",
            },
          ],
    });

    // Best-effort, and after the write: the access is already real, so a mail or
    // SMS failure must not fail the grant or leave the caller thinking it didn't
    // happen (see `ITeamNotifier`).
    if (this.notifier && signInUrl && !alreadyAdmin) {
      await this.notifier.adminGranted(
        { name: user.name, phone: user.phone, email: user.email },
        signInUrl,
      );
    }

    return user;
  }
}
