import type { AdminNotification, NewAdminNotification } from "../entities/AdminNotification";

/**
 * Storage for the bell's stored, per-admin notifications (see
 * `AdminNotification` for why these four events need their own table rather
 * than a derived read of the activity log).
 *
 * No transactional guarantee with the change each row describes, unlike
 * `IActivityLog`: these are fanned out to potentially several recipients
 * *after* the triggering write has already committed (an order placed, a
 * return requested, a review submitted, a stock adjustment applied) — best-
 * effort, the same standing every outbound notifier in this app already has.
 * A lost fan-out costs one admin one bell row, not the record of what
 * happened; that record is the change itself, already durable elsewhere.
 */
export type IAdminNotificationRepository = {
  /** One admin's notifications, newest first, capped at `limit`. */
  listForUser(userId: string, limit: number): Promise<AdminNotification[]>;
  /** How many of a user's notifications are unread. */
  countUnread(userId: string): Promise<number>;
  /** Record one notification for one recipient. */
  create(input: NewAdminNotification): Promise<AdminNotification>;
  /** Dismiss one notification — scoped to `userId`, so nobody can dismiss another admin's row. A no-op if it doesn't exist or isn't theirs. */
  markRead(id: string, userId: string): Promise<void>;
  /** Dismiss every one of a user's unread notifications at once — the bell's "Mark all read". */
  markAllRead(userId: string, at?: Date): Promise<void>;
};
