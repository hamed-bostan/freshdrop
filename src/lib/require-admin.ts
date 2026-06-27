import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";

/** Parse the comma-separated `ADMIN_USER_IDS` allowlist into a Set. */
function adminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/** True when the session belongs to a user in the `ADMIN_USER_IDS` allowlist. */
export function isAdmin(session: Session | null): boolean {
  return Boolean(session?.user?.id && adminIds().has(session.user.id));
}

/**
 * Non-redirecting admin guard for route handlers, which must answer with a JSON
 * status code rather than an HTML redirect (a `fetch` caller can't follow a login
 * redirect). Returns the session for an allowlisted admin, or `null` otherwise —
 * the caller decides the status (typically 401).
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();
  return isAdmin(session) ? session : null;
}

/**
 * Server-side guard for the admin dashboard. Returns the session when the signed-in
 * user's id is in the `ADMIN_USER_IDS` allowlist. Anonymous visitors are sent to
 * `/login` (with a `callbackUrl`); signed-in non-admins are sent home rather than
 * shown a 404, so the dashboard's existence isn't leaked.
 *
 * Used both in the dashboard layout (navigation guard) and inside each server
 * action (defense in depth — server actions are independently reachable endpoints).
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  if (!isAdmin(session)) {
    redirect("/");
  }

  return session;
}
