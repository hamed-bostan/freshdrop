import type { NotificationMessage, NotificationRecipient } from "../entities/Notification";

/**
 * A single delivery channel for a notification — SMS, push, email, or a logging
 * stub. A port so the notifier can fan a message out to any set of channels the
 * container wires, and a new channel is an added binding, not a use-case change.
 *
 * `send` is **best-effort**: it resolves whether or not delivery succeeded and
 * must not throw — one channel's failure (a dead SMS gateway, a missing phone)
 * can't sink the others or the request. Implementations log their own failures
 * and simply skip a recipient they can't reach (e.g. SMS with no phone).
 */
export type INotificationChannel = {
  send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void>;
};
