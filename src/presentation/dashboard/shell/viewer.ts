import type { Session } from "next-auth";
import type { UserRole } from "@/src/domain/entities/User";
import { sessionRole } from "@/src/lib/require-permission";
import { userRepository } from "@/src/infrastructure/container";

/**
 * Who is looking at the dashboard, as far as the chrome is concerned.
 *
 * Resolved once in the layout and handed down, so the sidebar's user card and the
 * top bar's menu can never disagree about the name or the role they show. It is
 * display data — the role here decides what is *drawn*, never what is allowed.
 */
export type DashboardViewer = {
  /** Display name, already fallen back to something printable by the layout. */
  name: string;
  /** Shown under the name in the menu; absent for a phone-only account. */
  email: string | null;
  /** Profile photo, when the account has one. */
  imageUrl: string | null;
  /** The effective role, labelled from the `dashTeam.roles` catalog. */
  role: UserRole;
};

/**
 * Builds the viewer the chrome draws, from the same session `requirePermission`
 * already verified. Reads the user row for the display fields and asks
 * `sessionRole` for the role rather than trusting the row's own — a break-glass
 * admin's row can lag the `owner` override that `ADMIN_USER_IDS` grants it.
 *
 * Returns `null` only when the row has vanished between the permission check and
 * this call (e.g. the account was deleted mid-session); the layout has no
 * sensible chrome to draw for that and falls back to the bare session id.
 */
export async function dashboardViewerFor(session: Session): Promise<DashboardViewer | null> {
  const userId = session.user.id;
  const [user, role] = await Promise.all([userRepository.getById(userId), sessionRole(session)]);
  if (!user || role == null) return null;

  return { name: user.name, email: user.email, imageUrl: user.avatarUrl, role };
}
