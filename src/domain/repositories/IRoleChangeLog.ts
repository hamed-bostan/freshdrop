import type { RoleChange } from "../entities/RoleChange";
import type { UserRole } from "../entities/User";

/**
 * A change about to be recorded. The timestamp is the store's to assign.
 * Constructed by the team use-cases and handed to `applyRoleChanges`.
 */
export type NewRoleChange = Omit<RoleChange, "id" | "at">;

/**
 * Read access to the append-only log of dashboard access changes.
 *
 * Read-only by design. Entries are written by `IUserRepository.applyRoleChanges`,
 * in the same transaction as the role change they describe, so an entry cannot go
 * missing while its change commits — or the reverse. Exposing a `record` here too
 * would offer a second, non-atomic way to write the same table, which is exactly
 * the gap that arrangement closes.
 */
export type IRoleChangeLog = {
  /** Most recent changes first, capped by `limit`. */
  list(limit: number): Promise<RoleChange[]>;
};

/** Re-exported for adapters mapping stored strings back to the domain union. */
export type { UserRole };
