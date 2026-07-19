import type {
  ActivityActorOption,
  ActivityEntry,
  ActivityFilters,
  ActivitySort,
  NewActivityEntry,
} from "../entities/ActivityEntry";
import type { Page, PageRequest } from "../entities/Pagination";

/**
 * The append-only activity log: read *and* write.
 *
 * Deliberately unlike `IStockMovementLog` (and the role-change log this replaced),
 * which are read-only ports whose entries the repositories write inside the
 * transaction that makes the change. Those cover one table each, so a repository
 * method could own both sides of the write. This log spans every entity, and what it
 * records isn't a column — it's *why* a use-case ran and who asked for it, which
 * the repository below it can't see.
 *
 * So the writes live one layer up, in the use-cases. That is the placement that
 * makes the log hard to bypass: a route handler is a thin controller that only
 * calls use-cases, so there is no path from an HTTP request to a change that
 * doesn't pass the code that records it. Logging from the handlers instead would
 * mean every new endpoint — and every internal caller, seed script or job — is one
 * forgotten line away from a silent change.
 *
 * The cost of that placement, stated plainly: an entry is written *after* the
 * change it describes commits, not inside its transaction. A crash in the window
 * between leaves a change with no entry. That is a real (small) gap, and it's the
 * price of covering every entity rather than the handful whose repositories could
 * be taught to log. Role changes keep their stronger guarantee — they still go
 * through `applyRoleChanges`, which writes the entry in the same transaction as
 * the role (see `RoleChangeBatch`) — because there the log and the change share a
 * database and nothing was gained by weakening it.
 *
 * There is no update and no delete, here or anywhere below. A record an admin can
 * quietly tidy up isn't one.
 */
export type IActivityLog = {
  /**
   * Append one entry. Callers treat this as best-effort: the change it describes
   * has already committed, so throwing here would report a completed operation as
   * failed and invite the operator to repeat it. `recordActivity` wraps this.
   */
  record(entry: NewActivityEntry): Promise<void>;

  /** One page of the log, newest first, narrowed by `filters`. */
  list(filters: ActivityFilters, page: PageRequest<ActivitySort>): Promise<Page<ActivityEntry>>;

  /**
   * One entity's own history, newest first, capped by `limit` — what the panels on
   * the order and product detail screens read. A thin case of `list`, kept
   * separate because a panel wants "the last N" and has no pager to drive.
   */
  listForEntity(entityType: string, entityId: string, limit: number): Promise<ActivityEntry[]>;

  /**
   * The distinct actors appearing in the log, for the actor filter's dropdown.
   *
   * Read from the log rather than from the team table on purpose: the filter has
   * to offer people who have *since* been removed, because their entries are still
   * there and are exactly what someone reviewing an incident came to find.
   *
   * `visibleEntityTypes` restricts which entries count, for the same reason it
   * does on `list` — a dropdown built over entries the viewer can't read would
   * name people whose only appearance in the log is one of those entries.
   */
  listActors(visibleEntityTypes?: readonly string[]): Promise<ActivityActorOption[]>;
};
