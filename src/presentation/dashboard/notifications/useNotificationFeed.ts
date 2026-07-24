import * as React from "react";
import { notificationsApi } from "./notification-api";
import type { NotificationFeedResponse } from "./notification-response-schema";

/** How often the badge refreshes in the background — frequent enough to feel live, rare enough to be free. */
const POLL_INTERVAL_MS = 60_000;

type NotificationFeedState = {
  feed: NotificationFeedResponse | null;
  isLoading: boolean;
  isError: boolean;
};

const IDLE: NotificationFeedState = { feed: null, isLoading: true, isError: false };

/**
 * Keeps the bell's feed loaded and its unread badge current.
 *
 * Fetches once on mount and then polls, the same `setTimeout`-chain-with-
 * visibility pattern `useLiveTracking` uses for the courier map — a chain
 * rather than `setInterval` so a slow response can never overlap the next
 * tick, and paused while the tab is hidden so a background tab isn't quietly
 * spending requests on a badge nobody can see.
 */
export function useNotificationFeed(): {
  feed: NotificationFeedResponse | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
} {
  const [state, setState] = React.useState<NotificationFeedState>(IDLE);

  const load = React.useCallback(async (): Promise<void> => {
    try {
      const feed = await notificationsApi.getFeed();
      setState({ feed, isLoading: false, isError: false });
    } catch {
      setState((prev) => ({ feed: prev.feed, isLoading: false, isError: true }));
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (): void => {
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    async function tick(): Promise<void> {
      if (typeof document === "undefined" || document.visibilityState !== "hidden") {
        await load();
      }
      if (!cancelled) schedule();
    }

    load().then(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  const markAllRead = React.useCallback(async (): Promise<void> => {
    // Optimistic: the badge clears and every stored row shows read immediately,
    // and a poll a moment later confirms it against the server rather than
    // waiting on one to agree first.
    const at = new Date().toISOString();
    setState((prev) =>
      prev.feed
        ? {
            ...prev,
            feed: {
              ...prev.feed,
              unreadCount: 0,
              notifications: prev.feed.notifications.map((n) => ({ ...n, readAt: n.readAt ?? at })),
            },
          }
        : prev,
    );
    await notificationsApi.markSeen();
  }, []);

  const dismiss = React.useCallback(async (id: string): Promise<void> => {
    // Optimistic, same reasoning as `markAllRead` — only decrements the badge
    // when the row was actually unread, so a repeat dismiss can't double-count.
    setState((prev) => {
      if (!prev.feed) return prev;
      const target = prev.feed.notifications.find((n) => n.id === id);
      if (!target || target.readAt) return prev;
      const at = new Date().toISOString();
      return {
        ...prev,
        feed: {
          ...prev.feed,
          unreadCount: Math.max(0, prev.feed.unreadCount - 1),
          notifications: prev.feed.notifications.map((n) => (n.id === id ? { ...n, readAt: at } : n)),
        },
      };
    });
    await notificationsApi.dismiss(id);
  }, []);

  return {
    feed: state.feed,
    isLoading: state.isLoading,
    isError: state.isError,
    refetch: load,
    markAllRead,
    dismiss,
  };
}
