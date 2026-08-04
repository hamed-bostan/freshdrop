import { describe, expect, it, vi } from "vitest";
import type { IAnalyticsCustomerRepository } from "../../../repositories/IAnalyticsRepository";
import type { ICustomerSegmentSnapshotRepository } from "../../../repositories/ICustomerSegmentSnapshotRepository";
import { SnapshotCustomerSegments } from "../SnapshotCustomerSegments";

describe("SnapshotCustomerSegments", () => {
  it("classifies against a trailing 30-day window ending `now` and records the day's assignments", async () => {
    const now = new Date("2026-08-04T15:30:00.000Z");
    const assignments = [{ userId: "u1", segment: "repeat_buyers" as const, orders: 2, revenue: 500 }];
    const customerSegmentAssignments = vi.fn().mockResolvedValue(assignments);
    const analytics = { customerSegmentAssignments } as unknown as IAnalyticsCustomerRepository;
    const record = vi.fn().mockResolvedValue(1);
    const snapshots = { record } as ICustomerSegmentSnapshotRepository;

    const result = await new SnapshotCustomerSegments(analytics, snapshots).execute(now);

    expect(result).toEqual({ capturedOn: "2026-08-04", written: 1 });
    const range = customerSegmentAssignments.mock.calls[0][0];
    // Bucket boundaries are `STORE_TIME_ZONE` (Asia/Tehran, UTC+3:30) midnight,
    // not UTC midnight — Aug 4 00:00 Tehran is Aug 3 20:30 UTC.
    expect(range.to.toISOString()).toBe("2026-08-04T20:30:00.000Z");
    expect(range.from.toISOString()).toBe("2026-07-05T20:30:00.000Z");
    expect(record).toHaveBeenCalledWith("2026-08-04", assignments);
  });

  it("is a no-op write when there are no assignments", async () => {
    const analytics = { customerSegmentAssignments: vi.fn().mockResolvedValue([]) } as unknown as IAnalyticsCustomerRepository;
    const record = vi.fn().mockResolvedValue(0);
    const snapshots = { record } as ICustomerSegmentSnapshotRepository;

    const result = await new SnapshotCustomerSegments(analytics, snapshots).execute(new Date("2026-08-04T00:00:00.000Z"));

    expect(result.written).toBe(0);
    expect(record).toHaveBeenCalledWith("2026-08-04", []);
  });
});
