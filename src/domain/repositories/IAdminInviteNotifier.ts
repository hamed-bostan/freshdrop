/** Who an admin invitation is going to, and how they can be reached. */
export type AdminInviteRecipient = {
  /** Display name, for the greeting. */
  name: string;
  /** The phone they'll sign in with — always present, since it *is* their identity. */
  phone: string;
  /** Contact email, when one was supplied; `null` skips the email channel. */
  email: string | null;
};

/**
 * Tells someone they've been given admin access. A port (not an implementation)
 * so the domain stays channel-agnostic: the container binds a notifier that fans
 * out to email and SMS without `GrantAdmin` knowing either exists.
 *
 * **Best-effort**: the grant has already committed by the time this is called, so
 * a delivery failure is logged by the implementation and never rethrown. The
 * invitation is a courtesy — the access it announces is already real, and the
 * person could sign in without ever receiving it.
 */
export type IAdminInviteNotifier = {
  /**
   * Announce the grant. `signInUrl` is an absolute URL to the sign-in page, built
   * by the caller (only the web layer knows the request's public origin).
   */
  adminGranted(recipient: AdminInviteRecipient, signInUrl: string): Promise<void>;
};
