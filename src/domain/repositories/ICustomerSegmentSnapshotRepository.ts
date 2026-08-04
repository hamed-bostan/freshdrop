import type { CustomerSegmentAssignment } from "../entities/CustomerSegmentsReport";

/**
 * The one write `CustomerSegmentSnapshot` ever gets, kept off `IAnalyticsRepository`
 * on purpose — that port promises read-only aggregates, and this is the daily job's
 * ledger write, a different kind of thing with a different caller (`SnapshotCustomerSegments`,
 * not a report route).
 */
export type ICustomerSegmentSnapshotRepository = {
  /**
   * Append one row per assignment for `capturedOn` (`YYYY-MM-DD`). Idempotent —
   * rerunning the job for a day already captured writes nothing new for the
   * customers it already has a row for, so an accidental double-trigger of the
   * cron endpoint is harmless. Returns how many rows were newly written.
   */
  record(capturedOn: string, assignments: CustomerSegmentAssignment[]): Promise<number>;
};
