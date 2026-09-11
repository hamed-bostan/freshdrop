import { z } from "zod";

/**
 * The single source of truth for profile-update input, shared by the client form
 * and the REST route handler (defensive re-validation — never trust the client).
 * Framework-free, so it stays importable from both. Identity (id/phone) is not
 * here: it comes from the session and can't be changed via the profile form.
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
  // Optional contact email — accept a blank string (the field left empty) and
  // normalize it to null server-side.
  email: z.union([z.string().trim().email("emailInvalid").max(120, "emailTooLong"), z.literal("")]),
  avatarUrl: z.string().url("imageInvalid").nullable(),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
