import { NextResponse } from "next/server";

import type { AdminNotification } from "@/src/domain/entities/AdminNotification";
import { GetNotificationFeed } from "@/src/domain/use-cases/notifications/GetNotificationFeed";
import { MarkNotificationsSeen } from "@/src/domain/use-cases/notifications/MarkNotificationsSeen";
import {
  activityLog,
  adminNotificationRepository,
  orderRepository,
  productRepository,
  reviewRepository,
  userRepository,
} from "@/src/infrastructure/container";
import { visibleActivityEntityTypes } from "@/src/lib/api/activity-visibility";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { isOwner } from "@/src/lib/require-admin";
import { getSessionWith } from "@/src/lib/require-permission";

// Every open reads the log, the stored notifications and the attention counts
// fresh — a badge that showed a cached count would be worse than none.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notifications — the bell's feed, from three sources (see
 * `GetNotificationFeed`): a filtered read of the activity log, the viewer's
 * own stored notifications, and the same "needs attention" counts the
 * dashboard overview computes — plus one combined unread count. Admin only,
 * same guard as `/api/admin/activity` — every dashboard role holds
 * `activity.view`, and team-access entries stay owner-only via the same
 * `visibleActivityEntityTypes` the activity endpoint applies.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWith("activity.view");
  if (!session?.user?.id) return unauthorizedResponse();

  const owner = await isOwner(session);

  try {
    const feed = await new GetNotificationFeed(
      activityLog,
      adminNotificationRepository,
      reviewRepository,
      productRepository,
      orderRepository,
      userRepository,
    ).execute(session.user.id, visibleActivityEntityTypes(owner));

    return NextResponse.json({
      activity: feed.activity.map(toActivityWire),
      unreadActivityCount: feed.unreadActivityCount,
      notifications: feed.notifications.map(toNotificationWire),
      attention: {
        pendingReviews: feed.attention.pendingReviews,
        lowStock: feed.attention.lowStock,
        staleOrders: feed.attention.staleOrders,
        staleOrdersCutoff: feed.attention.staleOrdersCutoff.toISOString(),
        overdueOrders: feed.attention.overdueOrders,
        overdueOrdersCutoff: feed.attention.overdueOrdersCutoff.toISOString(),
      },
      unreadCount: feed.unreadCount,
    });
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/notifications failed");
  }
}

/**
 * PUT /api/admin/notifications — "Mark all read" across both sources of the
 * feed (see `MarkNotificationsSeen`). Body-less — the instant is the server's,
 * not the client's, so a stale clock can't under- or over-mark. Per-item
 * dismiss is `PATCH /api/admin/notifications/:id` instead.
 */
export async function PUT(): Promise<NextResponse> {
  const session = await getSessionWith("activity.view");
  if (!session?.user?.id) return unauthorizedResponse();

  try {
    const at = await new MarkNotificationsSeen(userRepository, adminNotificationRepository).execute(
      session.user.id,
    );
    return NextResponse.json({ lastSeenNotificationsAt: at.toISOString() });
  } catch (error) {
    return errorResponseFromException(error, "PUT /api/admin/notifications failed");
  }
}

/** Dates cross the wire as ISO strings; the client schema parses them back. */
function toActivityWire<T extends { at: Date }>(entry: T): Omit<T, "at"> & { at: string } {
  return { ...entry, at: entry.at.toISOString() };
}

function toNotificationWire(
  notification: AdminNotification,
): Omit<AdminNotification, "createdAt" | "readAt"> & { createdAt: string; readAt: string | null } {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
  };
}
