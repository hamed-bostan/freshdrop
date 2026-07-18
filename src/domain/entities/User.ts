/**
 * What a user is allowed to do. Deliberately coarse (two levels): a single admin
 * bit covers everyone who runs the store today. Splitting it into per-permission
 * roles (fulfilment vs. refunds vs. catalog) is a later change and belongs in a
 * roles/permissions table, not in this union.
 */
export type UserRole = "customer" | "admin";

/** The persisted role values, for validating a string read from the database. */
export const USER_ROLES: readonly UserRole[] = ["customer", "admin"];

/** Narrow an arbitrary stored string to a `UserRole`, defaulting to the least privilege. */
export function toUserRole(value: string): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : "customer";
}

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
  /** Access level. Everyone is a `"customer"` until an admin promotes them. */
  role: UserRole;
}
