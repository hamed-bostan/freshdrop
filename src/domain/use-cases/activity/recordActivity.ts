import type { NewActivityEntry } from "../../entities/ActivityEntry";
import type { IActivityLog } from "../../repositories/IActivityLog";

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
 * it — turning one unrecorded price change into two real ones. The failure is
 * logged server-side, where it belongs, rather than handed to someone who can't
 * act on it.
 *
 * The `console.error` is the alarm. A log that silently stops recording is worse
 * than no log, because it reads as complete; this is the line that makes the gap
 * visible in the server output.
 */
export async function recordActivity(log: IActivityLog, entry: NewActivityEntry): Promise<void> {
  try {
    await log.record(entry);
  } catch (error) {
    console.error(
      `Failed to record activity: ${entry.action} on ${entry.entityType} ${entry.entityId}`,
      error,
    );
  }
}
