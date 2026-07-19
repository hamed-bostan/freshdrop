import type { NewActivityEntry } from "../../entities/ActivityEntry";
import type { IActivityLog } from "../../repositories/IActivityLog";

/**
 * The marker every failed audit write is logged under.
 *
 * A fixed, greppable string rather than prose: this is the line an alert rule
 * matches on and the line someone greps for when reconciling. Changing it breaks
 * whatever is watching for it, so it's a constant and not an inline template.
 */
export const ACTIVITY_WRITE_FAILURE = "ACTIVITY_LOG_WRITE_FAILED";

/**
 * Append an activity entry without letting a logging failure surface as a failed
 * operation.
 *
 * Every audited use-case calls this rather than `log.record` directly, so the
 * swallow happens in one place with one explanation instead of a dozen try/catch
 * blocks that each have to be trusted to be identical.
 *
 * Why swallow at all: the entry is written after the change it describes has
 * already committed (see `IActivityLog`). Rethrowing would answer a completed
 * request with an error, and an operator who is told "that didn't work" repeats
 * it — turning one unrecorded price change into two real ones.
 *
 * What makes that acceptable rather than merely convenient is the two things this
 * does before giving up:
 *
 *  1. **Retries once.** The overwhelmingly common failure here is transient — a
 *     dropped connection, a pool timeout under load — and a single immediate retry
 *     clears it. Once, not a loop: the caller is a request that has already done
 *     its real work, and holding it open to retry an audit write trades a durable
 *     failure for a slow one.
 *  2. **Emits the whole entry as structured JSON.** This is the part that makes a
 *     lost write recoverable instead of merely noticed. The line carries every
 *     field `record` would have persisted, so the entry can be reconstructed from
 *     log storage and replayed. An audit log that silently stops recording is
 *     worse than no audit log, because it still reads as complete — a bare "write
 *     failed" message would tell you that happened without telling you what was
 *     lost.
 */
export async function recordActivity(log: IActivityLog, entry: NewActivityEntry): Promise<void> {
  try {
    await log.record(entry);
    return;
  } catch {
    // Fall through to one retry. The first error is deliberately not logged — a
    // transient blip that the retry clears is noise, and noise in this channel is
    // what trains people to ignore the line that matters.
  }

  try {
    await log.record(entry);
  } catch (error) {
    console.error(
      `${ACTIVITY_WRITE_FAILURE} ${JSON.stringify({
        entry,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      })}`,
    );
  }
}
