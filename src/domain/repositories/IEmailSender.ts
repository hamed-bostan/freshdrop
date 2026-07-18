/** One outbound email. `html` is optional — `text` is always the fallback body. */
export type EmailMessage = {
  /** Recipient address. */
  to: string;
  subject: string;
  /** Plain-text body. Required: some clients (and every deliverability checker) want it. */
  text: string;
  /** Optional HTML body, shown in preference to `text` where the client supports it. */
  html?: string;
};

/**
 * Sends transactional email. A port (not an implementation) so the domain stays
 * transport-agnostic: the container binds SMTP, an HTTP provider, or a logging
 * stub without any use-case knowing which — the same Dependency Inversion the
 * repositories and notifiers use.
 *
 * `send` is **best-effort**: it resolves whether or not delivery succeeded and
 * must not throw. The state change that triggered the mail has already committed,
 * so a dead mail server can't be allowed to fail the request behind it.
 * Implementations log their own failures.
 */
export type IEmailSender = {
  send(message: EmailMessage): Promise<void>;
};
