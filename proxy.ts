import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing, type Locale } from "@/src/i18n/routing";
import { ONBOARDED_COOKIE } from "@/src/lib/onboarding";

/**
 * Request proxy (Next 16's rename of "middleware"; always runs on the Node.js
 * runtime). Composes three concerns — browsing is never blocked:
 *
 * 1. Locale routing (next-intl) — resolves the locale, serves English un-prefixed
 *    and Persian under `/fa`, and rewrites/redirects accordingly.
 * 2. Onboarding — the one-time intro is only triggered from the home entry, so deep
 *    links (shared product/category URLs) render freely; onboarded users are kept out
 *    of `/onboarding`. Redirects preserve the active locale.
 * 3. Exposes the current path as `x-pathname` so server-side guards (account routes)
 *    can build an accurate `callbackUrl`.
 *
 * Auth is NOT enforced here — account routes guard themselves server-side via
 * `requireAuth()`, leaving the storefront fully browsable without a session.
 */
const handleI18nRouting = createMiddleware(routing);

/** Split a leading locale segment off a pathname ("/fa/cart" → { fa, "/cart" }). */
function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const path = "/" + rest.join("/");
    return { locale: maybeLocale as Locale, path: path === "/" ? "/" : path.replace(/\/$/, "") };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

/** Re-attach the locale prefix (none for the default locale — `localePrefix: as-needed`). */
function localize(locale: Locale, path: string): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function proxy(request: NextRequest) {
  const { locale, path } = splitLocale(request.nextUrl.pathname);
  const onboarded = request.cookies.has(ONBOARDED_COOKIE);

  // Onboarding gate — keep the active locale on the redirect target.
  if (path === "/onboarding") {
    if (onboarded) {
      return NextResponse.redirect(new URL(localize(locale, "/"), request.url));
    }
  } else if (path === "/" && !onboarded) {
    return NextResponse.redirect(new URL(localize(locale, "/onboarding"), request.url));
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
