import type { RoleChange } from "../entities/RoleChange";
import type { UserRole } from "../entities/User";

/** A change about to be recorded. The timestamp is the store's to assign. */
export type NewRoleChange = Omit<RoleChange, "id" | "at">;

/**
 * Append-only log of dashboard access changes.
 *
 * Deliberately *not* best-effort, unlike the notifiers: a silently missing audit
 * entry is worse than a failed request, so `record` propagates its errors and the
 * caller's operation fails with it. The write is not atomic with the role change
 * it describes — a crash between the two can still lose an entry — which is the
 * honest limit of doing this without a transaction spanning both.
 */
export type IRoleChangeLog = {
  record(entry: NewRoleChange): Promise<void>;
  /** Most recent changes first, capped by `limit`. */
  list(limit: number): Promise<RoleChange[]>;
};

/** Re-exported for adapters mapping stored strings back to the domain union. */
export type { UserRole };
