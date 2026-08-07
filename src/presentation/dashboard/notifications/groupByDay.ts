/** One calendar day's slice of an already newest-first list, plus which day it is. */
export type DayGroup<T> = {
  /** `YYYY-MM-DD` in the viewer's local time zone — stable, sortable, and distinct per day. */
  dateKey: string;
  /** The instant used to derive `dateKey`, for formatting the group's heading. */
  at: Date;
  items: T[];
};

function dateKey(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
}

/**
 * Bucket an already newest-first list into consecutive same-day runs.
 *
 * Assumes the input is sorted by `getAt` descending (every caller here reads it
 * straight off the activity log, which is always newest-first) — grouping by
 * consecutive run rather than a full partition is what keeps this a single pass.
 */
export function groupByDay<T>(items: readonly T[], getAt: (item: T) => Date): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];

  for (const item of items) {
    const at = getAt(item);
    const key = dateKey(at);
    const current = groups[groups.length - 1];
    if (current?.dateKey === key) {
      current.items.push(item);
    } else {
      groups.push({ dateKey: key, at, items: [item] });
    }
  }

  return groups;
}

/** Whether `at` falls on the same local calendar day as `now`. */
export function isSameDay(at: Date, now: Date): boolean {
  return dateKey(at) === dateKey(now);
}

/** Whether `at` falls on the local calendar day before `now`. */
export function isYesterday(at: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey(at) === dateKey(yesterday);
}
