/**
 * What a user is allowed to do.
 *
 * - `customer` — the storefront only. Everyone starts here.
 * - `admin` — runs the store: catalog, orders, reviews, customers.
 * - `owner` — an admin who also manages the team, and the one account no peer can
 *   remove. Exactly one exists. This is the tier that keeps admin power from
 *   being symmetric: without it, any admin could demote all the others.
 *
 * Still coarse on purpose — `admin` is one bit covering every store operation.
 * Splitting that into per-permission roles (fulfilment vs. refunds vs. catalog)
 * is a later change and belongs in a roles/permissions table, not in this union.
 */
export type UserRole = "customer" | "admin" | "owner";

/** The persisted role values, for validating a string read from the database. */
export const USER_ROLES: readonly UserRole[] = ["customer", "admin", "owner"];

/** The roles that can reach the dashboard — `owner` is a superset of `admin`. */
export const DASHBOARD_ROLES: readonly UserRole[] = ["admin", "owner"];

/** True when the role grants dashboard access (i.e. is `admin` or `owner`). */
export function isDashboardRole(role: UserRole): boolean {
  return DASHBOARD_ROLES.includes(role);
}

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
