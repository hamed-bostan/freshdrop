import type {
  NotificationKind,
  NotificationMessage,
  NotificationRecipient,
} from "@/src/domain/entities/Notification";
import type { INotificationChannel } from "@/src/domain/repositories/INotificationChannel";
import { normalizePhone, sendPatternSms, type SmsIrClientConfig } from "../sms/smsIrClient";

/** SMS.ir template ids keyed by event — each event needs its own approved template. */
export type SmsIrTemplateMap = Partial<Record<NotificationKind, number>>;

export type SmsIrNotificationChannelConfig = SmsIrClientConfig & {
  /** Approved pattern-template id per notification kind. A kind with no id is skipped. */
  templates: SmsIrTemplateMap;
};

/**
 * Delivers order notifications over SMS via SMS.ir pattern templates — the same
 * approved-template send the OTP login uses (see `smsIrClient`). Each event maps
 * to its own `templateId`; the message's `params` fill that template's named
 * `#PARAM#` slots.
 *
 * Best-effort per the {@link INotificationChannel} contract: a recipient with no
 * phone, or a kind with no configured template, is silently skipped, and a send
 * failure is logged (inside `sendPatternSms`), never thrown — the order state
 * change that triggered this has already committed.
 */
export class SmsIrNotificationChannel implements INotificationChannel {
  constructor(private readonly config: SmsIrNotificationChannelConfig) {}

  async send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void> {
    if (!recipient.phone) return; // no phone on file — nothing to send

    const templateId = this.config.templates[message.kind];
    if (templateId === undefined) return; // no approved template for this event

    const params = Object.entries(message.params).map(([name, value]) => ({ name, value }));
    await sendPatternSms(this.config, normalizePhone(recipient.phone), templateId, params);
  }
}
