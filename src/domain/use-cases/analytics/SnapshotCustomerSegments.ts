import { presetRange, startOfUtcDay } from "../../entities/Analytics";
import type { IAnalyticsRepository } from "../../repositories/IAnalyticsRepository";
import type { ICustomerSegmentSnapshotRepository } from "../../repositories/ICustomerSegmentSnapshotRepository";

/**
 * Classifies every customer against a trailing 30-day window ending `now` and
 * appends one row per customer to `CustomerSegmentSnapshot` for that day.
 *
 * Reuses `presetRange("30d", now)` rather than inventing a separate window —
 * the same trailing-30-day period the customer-insights report defaults to,
 * so a snapshot means the same thing a report reader already expects "30d"
 * to mean. Run once daily; a rerun for a day already captured is a no-op (see
 * `ICustomerSegmentSnapshotRepository.record`).
 */
export class SnapshotCustomerSegments {
  constructor(
    private readonly analytics: IAnalyticsRepository,
    private readonly snapshots: ICustomerSegmentSnapshotRepository,
  ) {}

  async execute(now: Date = new Date()): Promise<{ capturedOn: string; written: number }> {
    const range = presetRange("30d", now);
    const assignments = await this.analytics.customerSegmentAssignments(range);
    const capturedOn = startOfUtcDay(now).toISOString().slice(0, 10);
    const written = await this.snapshots.record(capturedOn, assignments);
    return { capturedOn, written };
  }
}
