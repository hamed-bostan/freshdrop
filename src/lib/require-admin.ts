import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

/**
 * Server-side guard for the admin dashboard. Returns the session when the signed-in
 * user's id is in the `ADMIN_USER_IDS` allowlist. Anonymous visitors are sent to
 * `/login` (with a `callbackUrl`); signed-in non-admins are sent home rather than
 * shown a 404, so the dashboard's existence isn't leaked.
 *
 * Used both in the dashboard layout (navigation guard) and inside each server
 * action (defense in depth — server actions are independently reachable endpoints).
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  if (!session.user.id || !adminIds().has(session.user.id)) {
    redirect("/");
  }

  return session;
}
