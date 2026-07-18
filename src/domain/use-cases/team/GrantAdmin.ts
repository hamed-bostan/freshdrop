import type { User } from "../../entities/User";
import { isPlausiblePhone, normalizePhone } from "../../entities/Phone";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Promote the holder of a phone number to admin.
 *
 * The phone *is* the invitation. Because a user's id is their normalized phone
 * and sign-in is OTP on that number, granting the role to a number is equivalent
 * to sending an invite that only its owner can accept: nobody reaches the
 * dashboard without proving possession of the phone via OTP. That removes the
 * usual emailed-token dance (generate, deliver, expire, redeem) along with the
 * window in which a leaked token is worth stealing.
 *
 * Idempotent, and safe to run before the person has ever signed in — the row
 * they'd be given at first sign-in is simply written early, with a placeholder
 * name they overwrite when they complete their profile. `GetOrCreateUser` finds
 * that existing row on their first sign-in and leaves the role intact.
 */
export class GrantAdmin {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(phone: string): Promise<User> {
    const id = normalizePhone(phone);

    if (!isPlausiblePhone(phone)) {
      throw new ValidationError("phone", "Enter a valid phone number.");
    }

    return this.userRepo.setRole({ id, phone: phone.trim(), role: "admin" });
  }
}
