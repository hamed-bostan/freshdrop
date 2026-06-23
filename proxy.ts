import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDED_COOKIE } from "@/src/lib/onboarding";

/**
 * Request proxy (Next 16's rename of "middleware"; always runs on the Node.js
 * runtime). Two light-touch concerns — browsing is never blocked:
 *
 * 1. Onboarding — the one-time intro is only triggered from the home entry, so
 *    deep links (shared product/category URLs) render freely; onboarded users
 *    are kept out of `/onboarding`.
 * 2. Exposes the current path as `x-pathname` so server-side guards (account
 *    routes) can build an accurate `callbackUrl`.
 *
 * Auth is NOT enforced here — account routes guard themselves server-side via
 * `requireAuth()`, leaving the storefront fully browsable without a session.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onboarded = request.cookies.has(ONBOARDED_COOKIE);

  if (pathname === "/onboarding") {
    return onboarded ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (pathname === "/" && !onboarded) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // App routes only — skip Next internals, API routes, and any file with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
