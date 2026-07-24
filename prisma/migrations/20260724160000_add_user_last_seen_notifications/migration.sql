-- When a user last opened the notification bell. Nullable — null until their
-- first open, so a brand-new admin's whole feed reads as unread rather than
-- nothing. Drives the bell's unread badge; there is no per-notification row to
-- flag, since the feed is derived (activity log + attention counts) rather
-- than stored.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_seen_notifications_at" TIMESTAMP(3);
