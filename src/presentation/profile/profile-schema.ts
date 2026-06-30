import { z } from "zod";

/**
 * The single source of truth for profile-update input, shared by the client form
 * and the REST route handler (defensive re-validation — never trust the client).
 * Framework-free, so it stays importable from both. Identity (id/phone) is not
 * here: it comes from the session and can't be changed via the profile form.
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  // Optional contact email — accept a blank string (the field left empty) and
  // normalize it to null server-side.
  email: z.union([z.string().trim().email("Enter a valid email.").max(120, "Email is too long."), z.literal("")]),
  avatarUrl: z.string().url("Upload a valid image.").nullable(),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
