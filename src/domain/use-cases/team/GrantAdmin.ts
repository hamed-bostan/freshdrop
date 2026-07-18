import type { User } from "../../entities/User";
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

  async execute(input: GrantAdminCommand, signInUrl?: string): Promise<User> {
    const id = normalizePhone(input.phone);

    if (!isPlausiblePhone(input.phone)) {
      throw new ValidationError("phone", "Enter a valid phone number.");
    }

    const email = input.email?.trim() || null;
    // Whether this grant actually changes anything decides if an invitation goes
    // out. Re-granting someone who is already an admin is a harmless no-op on the
    // row, but mailing them "you've been given access" a second time is not — it
    // reads as a new event and invites a support question.
    const existing = await this.userRepo.getById(id);
    const alreadyAdmin = existing?.role === "admin";

    const user = await this.userRepo.setRole({
      id,
      phone: input.phone.trim(),
      role: "admin",
      email,
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
