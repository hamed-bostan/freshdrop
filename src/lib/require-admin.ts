import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { userRepository } from "@/src/infrastructure/container";

/**
 * Parse the comma-separated `ADMIN_USER_IDS` allowlist into a Set.
 *
 * This is the break-glass path, not the normal one: admin access lives on the
 * user's `role` in the database and is managed from the dashboard's team page.
 * The allowlist survives so an owner can always get back in — if the last admin
 * is demoted, or the team table is wrong, setting this env var restores access
 * without a database console. Ids here are *not* revocable through the UI.
 */
function breakGlassIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/** True when the id is an unrevocable break-glass admin from the environment. */
export function isBreakGlassAdmin(userId: string): boolean {
  return breakGlassIds().has(userId);
}

/**
 * The configured break-glass ids, for callers that must fold them into a listing
 * of who has access (see `ListAdmins`) — the domain can't read the environment.
 */
export function breakGlassAdminIds(): string[] {
  return [...breakGlassIds()];
}

/**
 * True when the session belongs to an admin — either the persisted `admin` role
 * or the break-glass allowlist.
 *
 * The role is read from the database on every check rather than carried in the
 * session JWT. That costs one indexed lookup per admin request (admin traffic is
 * a rounding error next to the storefront) and buys instant revocation: a
 * demoted admin loses access on their next request instead of whenever their
 * token happens to expire.
 */
export async function isAdmin(session: Session | null): Promise<boolean> {
  const userId = session?.user?.id;
  if (!userId) return false;
  if (isBreakGlassAdmin(userId)) return true;

  const user = await userRepository.getById(userId);
  return user?.role === "admin";
}

/**
 * Non-redirecting admin guard for route handlers, which must answer with a JSON
 * status code rather than an HTML redirect (a `fetch` caller can't follow a login
 * redirect). Returns the session for an admin, or `null` otherwise — the caller
 * decides the status (typically 401).
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();
  return (await isAdmin(session)) ? session : null;
}

/**
 * Server-side guard for the admin dashboard. Returns the session when the signed-in
 * user holds the admin role (or is break-glass allowlisted). Anonymous visitors are
 * sent to `/login` (with a `callbackUrl`); signed-in non-admins are sent home rather
 * than shown a 404, so the dashboard's existence isn't leaked.
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

  if (!(await isAdmin(session))) {
    redirect("/");
  }

  return session;
}
