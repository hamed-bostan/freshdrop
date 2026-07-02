import type { NotificationMessage, NotificationRecipient } from "@/src/domain/entities/Notification";
import type { INotificationChannel } from "@/src/domain/repositories/INotificationChannel";

/**
 * A channel that logs the notification server-side instead of delivering it —
 * the stand-in until a real transport is wired (this is the **push** channel for
 * now, before web-push exists; also the SMS fallback when no SMS.ir key is set).
 * Same spirit as `LoggingStockAlertNotifier`: the container binds it behind
 * {@link INotificationChannel}, so swapping in a real transport touches only the
 * composition root. Best-effort by construction — logging never throws.
 */
export class LoggingNotificationChannel implements INotificationChannel {
  /** `label` names the channel in the log line (e.g. "push", "sms"). */
  constructor(private readonly label: string) {}

  async send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void> {
    console.info(
      `[notification:${this.label}] ${message.kind} → user ${recipient.userId}` +
        `${recipient.phone ? ` (${recipient.phone})` : ""}: ${message.body}`,
    );
  }
}
