import type { UserRole } from "./User";

/**
 * One recorded change of dashboard access. Names are captured at the time of the
 * change rather than resolved on read, so an entry stays truthful about who did
 * what even after a rename — or after the account is gone entirely.
 */
export type RoleChange = {
  id: string;
  /** Whose access changed. */
  userId: string;
  /** Their name at the time. */
  userName: string;
  /** Who made the change. */
  actorId: string;
  /** The actor's name at the time. */
  actorName: string;
  fromRole: UserRole;
  toRole: UserRole;
  at: Date;
};

/**
 * What a change amounted to, derived from the roles rather than stored — a second
 * field naming the action could contradict the roles it claims to describe.
 *
 * `claimed` and `taken` are both "someone made themselves owner"; they differ
 * only in whether a previous owner was displaced, which the accompanying entries
 * record. `takeOver` is the one worth recognising on sight.
 */
export type RoleChangeKind =
  | "granted"
  | "revoked"
  | "ownershipTransferred"
  | "ownershipClaimed"
  | "steppedDown";

/**
 * Takes only the fields it reads rather than a whole `RoleChange`, so it works on
 * the entity and on the wire shape alike (which carries `at` as an ISO string).
 */
export function roleChangeKind(
  change: Pick<RoleChange, "userId" | "actorId" | "fromRole" | "toRole">,
): RoleChangeKind {
  if (change.toRole === "owner") {
    return change.userId === change.actorId ? "ownershipClaimed" : "ownershipTransferred";
  }
  if (change.fromRole === "owner") return "steppedDown";
  return change.toRole === "customer" ? "revoked" : "granted";
}
