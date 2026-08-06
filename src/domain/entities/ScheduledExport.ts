/**
 * A standing "generate this export automatically" rule — the Export center's
 * Scheduled reports panel. Distinct from `ExportJob`: a schedule is the
 * standing configuration ("orders, weekly, Monday 6am, email ops@store"); a
 * job is one run of it (or of the builder), with its own status and file.
 * `RunDueSchedules` is the bridge — it turns a due schedule into a fresh
 * `ExportJob` with `source: "schedule"`.
 *
 * Framework-free, so it's importable from anywhere in the app.
 */

import type { ExportFormat, ExportJobParams, ExportJobReportId } from "./ExportJob";

export const SCHEDULE_CADENCES = ["weekly", "monthly"] as const;
export type ScheduleCadence = (typeof SCHEDULE_CADENCES)[number];

export function toScheduleCadence(value: string): ScheduleCadence {
  return (SCHEDULE_CADENCES as readonly string[]).includes(value) ? (value as ScheduleCadence) : "weekly";
}

export type ScheduledExport = {
  id: string;
  reportId: ExportJobReportId;
  format: ExportFormat;
  /** The builder's selection this schedule replays on every run — see `ExportJobParams`. */
  params: ExportJobParams;
  cadence: ScheduleCadence;
  /** 0 (Sunday) – 6 (Saturday). Set for `weekly`, `null` for `monthly`. */
  dayOfWeek: number | null;
  /**
   * 1–28. Set for `monthly`, `null` for `weekly`. Capped at 28 (rather than
   * allowing 29–31) so every month has that day — a schedule for "the 31st"
   * would silently skip February, April, June, September and November, which
   * is a worse surprise than a slightly-early end-of-month run.
   */
  dayOfMonth: number | null;
  /** 0–23, the hour of day in `timezone` the schedule fires. */
  hour: number;
  /** IANA zone name, e.g. `"Asia/Tehran"`. */
  timezone: string;
  /** Email to send the secure link to when the run completes. `null` disables delivery (download-only, from the schedules list). */
  deliverTo: string | null;
  active: boolean;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  /** When this schedule next fires. Advanced by `RunDueSchedules` after each run, recomputed by `SaveScheduledExport` whenever the timing fields change. */
  nextRunAt: Date;
};

/** A schedule about to be created. The store assigns `id`, `createdAt`, `updatedAt` and `lastRunAt` (null). */
export type NewScheduledExport = Omit<ScheduledExport, "id" | "createdAt" | "updatedAt" | "lastRunAt">;

/** The subset of fields `SaveScheduledExport` may change on an existing schedule. */
export type ScheduledExportEdits = Omit<
  NewScheduledExport,
  "createdById" | "createdByName" | "active" | "nextRunAt"
>;

export type ScheduledExportFilters = {
  /** Same composition as `ExportJobFilters.visibleReportIds` — a viewer's permission scopes what they may see. */
  visibleReportIds?: readonly ExportJobReportId[];
};

/**
 * Read the wall-clock date/time parts of `instant` as observed in `timeZone`,
 * via `Intl` rather than a date library (none is a dependency here — see the
 * Export center plan). `weekday` is Sunday-based (0–6) to match `dayOfWeek`.
 */
function zonedParts(instant: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdays.indexOf(parts.weekday ?? "Sun"),
  };
}

/**
 * The UTC instant at which the wall-clock time `y-m-d hour:minute:00` occurs
 * in `timeZone`. Standard two-pass technique for converting a zoned wall time
 * to an instant without a timezone database dependency: guess the instant by
 * treating the wall time as UTC, read back what that guess actually reads as
 * in `timeZone`, then correct by the difference. Converges in one correction
 * except right around a DST transition, where a second pass settles it.
 */
function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 2; i++) {
    const observed = zonedParts(guess, timeZone);
    const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
    const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = wanted - observedAsUtc;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

/**
 * The next instant, strictly after `after`, at which a schedule with these
 * timing fields fires — the Scheduled reports panel's "Next run", and what
 * `SaveScheduledExport`/`RunDueSchedules` persist as `nextRunAt`.
 *
 * Walks forward day by day (in the schedule's own timezone) from `after`'s
 * local date, looking for a day matching the cadence, then converts that
 * day's `hour:00` to a UTC instant and checks it's actually after `after` —
 * a same-day match whose hour has already passed rolls to the next matching
 * day. Bounded to a bit over a month of iterations, comfortably more than a
 * monthly cadence ever needs.
 */
export function computeNextRunAt(
  schedule: Pick<ScheduledExport, "cadence" | "dayOfWeek" | "dayOfMonth" | "hour" | "timezone">,
  after: Date,
): Date {
  const local = zonedParts(after, schedule.timezone);
  let cursor = Date.UTC(local.year, local.month - 1, local.day);
  const maxIterations = 40;

  for (let i = 0; i < maxIterations; i++) {
    const cursorDate = new Date(cursor);
    const y = cursorDate.getUTCFullYear();
    const m = cursorDate.getUTCMonth() + 1;
    const d = cursorDate.getUTCDate();
    const weekday = cursorDate.getUTCDay();

    const matches = schedule.cadence === "weekly" ? weekday === schedule.dayOfWeek : d === schedule.dayOfMonth;
    if (matches) {
      const candidate = zonedTimeToUtc(y, m, d, schedule.hour, 0, schedule.timezone);
      if (candidate.getTime() > after.getTime()) return candidate;
    }
    cursor += 24 * 60 * 60 * 1000;
  }

  // Unreachable for valid `dayOfWeek`/`dayOfMonth` (every weekday recurs within
  // 7 days, every 1–28 within 31) — a safety net rather than a real fallback.
  return new Date(after.getTime() + 24 * 60 * 60 * 1000);
}
