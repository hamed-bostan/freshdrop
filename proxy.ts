import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/src/i18n/routing";
import { ONBOARDED_COOKIE } from "@/src/lib/onboarding";

/**
 * Request proxy (Next 16's rename of "middleware"; always runs on the Node.js
 * runtime). Composes three concerns — browsing is never blocked:
 *
 * 1. Locale routing (next-intl) — resolves the locale from the `NEXT_LOCALE` cookie
 *    (then `accept-language`, then the default) and rewrites the request internally
 *    onto the `[locale]` segment. URLs are locale-agnostic (`localePrefix: "never"`).
 * 2. Onboarding — the one-time intro is only triggered from the home entry, so deep
 *    links (shared product/category URLs) render freely; onboarded users are kept out
 *    of `/onboarding`.
 * 3. Exposes the current path as `x-pathname` so server-side guards (account routes)
 *    can build an accurate `callbackUrl`.
 *
 * Auth is NOT enforced here — account routes guard themselves server-side via
 * `requireAuth()`, leaving the storefront fully browsable without a session.
 */
const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  // URLs carry no locale prefix, so the pathname is used as-is for the onboarding gate.
  const path = request.nextUrl.pathname;
  const onboarded = request.cookies.has(ONBOARDED_COOKIE);

  if (path === "/onboarding") {
    if (onboarded) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else if (path === "/" && !onboarded) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Expose the current path to server-side guards (requireAuth callbackUrl). next-intl
  // copies the incoming request headers onto the request it forwards, so setting this on
  // a cloned request propagates it through the locale rewrite.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return handleI18nRouting(new NextRequest(request, { headers: requestHeaders }));
}

export const config = {
  // App routes only — skip Next internals, API routes, and any file with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
