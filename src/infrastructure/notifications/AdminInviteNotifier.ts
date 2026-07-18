import type { IEmailSender } from "@/src/domain/repositories/IEmailSender";
import type {
  AdminInviteRecipient,
  IAdminInviteNotifier,
} from "@/src/domain/repositories/IAdminInviteNotifier";
import { normalizePhone, sendPatternSms, type SmsIrClientConfig } from "../sms/smsIrClient";

export type AdminInviteSmsConfig = SmsIrClientConfig & {
  /** Approved SMS.ir pattern-template id for the invite. Omit to skip the SMS channel. */
  templateId?: number;
};

/**
 * Announces an admin grant over email and SMS.
 *
 * Deliberately *not* wired through `INotificationChannel`: that port carries
 * `NotificationMessage`, which is order-shaped (it requires an `orderId` and a
 * `NotificationKind` from the order lifecycle). Widening those types so an
 * account-level event could travel through them would make every order channel
 * handle a message with no order — a worse trade than this small dedicated
 * notifier.
 *
 * Both channels are best-effort and independent: a missing email, an unconfigured
 * SMS template, or a dead mail server each skip that channel without affecting the
 * other, and never throw (see {@link IAdminInviteNotifier}).
 */
export class AdminInviteNotifier implements IAdminInviteNotifier {
  constructor(
    private readonly email: IEmailSender,
    private readonly sms?: AdminInviteSmsConfig,
  ) {}

  async adminGranted(recipient: AdminInviteRecipient, signInUrl: string): Promise<void> {
    await Promise.all([this.sendEmail(recipient, signInUrl), this.sendSms(recipient, signInUrl)]);
  }

  private async sendEmail(recipient: AdminInviteRecipient, signInUrl: string): Promise<void> {
    if (!recipient.email) return; // no address on file — nothing to send

    // The copy states the phone explicitly because that, not the email, is what
    // they sign in with — the single most confusing thing about being invited by
    // mail to a phone-identified account.
    const text = [
      `Hi ${recipient.name},`,
      "",
      "You've been given admin access to the FreshDrop dashboard.",
      "",
      `Sign in at ${signInUrl} using your phone number (${recipient.phone}).`,
      "You'll receive a one-time code by SMS to confirm it's you.",
      "",
      "If you weren't expecting this, you can ignore this email — and let the sender know.",
    ].join("\n");

    await this.email.send({
      to: recipient.email,
      subject: "You've been given admin access to FreshDrop",
      text,
    });
  }

  private async sendSms(recipient: AdminInviteRecipient, signInUrl: string): Promise<void> {
    if (!this.sms?.templateId) return; // no approved template configured

    await sendPatternSms(this.sms, normalizePhone(recipient.phone), this.sms.templateId, [
      { name: "NAME", value: recipient.name },
      { name: "URL", value: signInUrl },
    ]);
  }
}
