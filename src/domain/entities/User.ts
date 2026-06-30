export type User = {
  /** Stable identifier — the user's normalized phone digits (also the session id). */
  id: string;
  /** The phone the user signed in with (display form, e.g. with country code). */
  phone: string;
  /** Display/full name. Falls back to a placeholder until the profile is completed. */
  name: string;
  /** Contact email, once provided. */
  email: string | null;
  /** Public URL of the profile picture, once uploaded. */
  avatarUrl: string | null;
}
