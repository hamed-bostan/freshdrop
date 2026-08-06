import { describe, expect, it } from "vitest";
import { computeNextRunAt } from "../ScheduledExport";

describe("computeNextRunAt", () => {
  it("finds the next matching weekday, in UTC, strictly after `after`", () => {
    // 2026-08-03 is a Monday.
    const after = new Date("2026-08-01T00:00:00.000Z"); // a Saturday
    const next = computeNextRunAt({ cadence: "weekly", dayOfWeek: 1, dayOfMonth: null, hour: 6, timezone: "UTC" }, after);
    expect(next.toISOString()).toBe("2026-08-03T06:00:00.000Z");
  });

  it("rolls to next week when `after` is already past this week's fire time", () => {
    const after = new Date("2026-08-03T07:00:00.000Z"); // Monday, an hour after 06:00
    const next = computeNextRunAt({ cadence: "weekly", dayOfWeek: 1, dayOfMonth: null, hour: 6, timezone: "UTC" }, after);
    expect(next.toISOString()).toBe("2026-08-10T06:00:00.000Z");
  });

  it("fires later the same day when `after` is still before this week's fire time", () => {
    const after = new Date("2026-08-03T01:00:00.000Z"); // Monday, before 06:00
    const next = computeNextRunAt({ cadence: "weekly", dayOfWeek: 1, dayOfMonth: null, hour: 6, timezone: "UTC" }, after);
    expect(next.toISOString()).toBe("2026-08-03T06:00:00.000Z");
  });

  it("finds the next matching day-of-month for a monthly cadence", () => {
    const after = new Date("2026-08-03T00:00:00.000Z");
    const next = computeNextRunAt({ cadence: "monthly", dayOfWeek: null, dayOfMonth: 15, hour: 6, timezone: "UTC" }, after);
    expect(next.toISOString()).toBe("2026-08-15T06:00:00.000Z");
  });

  it("rolls a monthly schedule into next month once this month's day has passed", () => {
    const after = new Date("2026-08-20T00:00:00.000Z");
    const next = computeNextRunAt({ cadence: "monthly", dayOfWeek: null, dayOfMonth: 15, hour: 6, timezone: "UTC" }, after);
    expect(next.toISOString()).toBe("2026-09-15T06:00:00.000Z");
  });

  it("converts a non-UTC timezone's wall-clock hour to the correct UTC instant", () => {
    // Asia/Tehran is UTC+3:30 (no DST) — 06:00 Tehran is 02:30 UTC.
    const after = new Date("2026-08-01T00:00:00.000Z");
    const next = computeNextRunAt({ cadence: "weekly", dayOfWeek: 1, dayOfMonth: null, hour: 6, timezone: "Asia/Tehran" }, after);
    expect(next.toISOString()).toBe("2026-08-03T02:30:00.000Z");
  });
});
