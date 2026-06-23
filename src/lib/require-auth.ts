import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side guard for account routes. Returns the session when signed in;
 * otherwise redirects to `/login` with a `callbackUrl` so the user lands back
 * where they were. The path comes from the `x-pathname` header set in middleware.
 */
export async function requireAuth() {
  const session = await auth();
  if (session) return session;

  const pathname = (await headers()).get("x-pathname") ?? "/";
  redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
}
