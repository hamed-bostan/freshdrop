import { z } from "zod";

/**
 * The single source of truth for granting admin access, shared by the client form
 * (React Hook Form resolver) and the REST route handler (defensive re-validation —
 * never trust the client). Framework-free, so it stays importable from both.
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 *
 * Only a phone is collected: the number *is* the invitation. A user's id is their
 * normalized phone and sign-in is OTP on that number, so granting the role to a
 * phone can only ever be redeemed by whoever holds the SIM.
 */
export const grantAdminSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "phoneRequired")
    // Digits, spaces and the usual separators — normalization to canonical digits
    // happens in the domain (see `normalizePhone`), so the form stays permissive
    // about how the number is typed (+98…, 98…, 09…).
    .regex(/^[+\d][\d\s()-]{7,19}$/, "phoneInvalid"),
});

/** Form value shape, and the validated payload the route forwards to the use-case. */
export type GrantAdminInput = z.infer<typeof grantAdminSchema>;
