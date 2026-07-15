import { defineRouting } from "next-intl/routing";

// Locale routing config, shared by the middleware, the navigation helpers, and the
// request config. English is the default and stays un-prefixed (existing URLs are
// unchanged); Persian is served under `/fa` (`localePrefix: "as-needed"`).
//
// The URL is the source of truth for locale (per-locale URLs + hreflang/canonical =
// SEO-correct), so an explicit `/fa` URL always renders Persian regardless of cookie —
// switching language applies going forward, and Back returns to prior pages in their
// own URL's locale. The cookie is only the fallback for locale-less entry points (the
// root). next-intl's default `NEXT_LOCALE` cookie is session-scoped, so a returning
// visitor loses their choice; make it persist for a year so entry points remember it.
export const routing = defineRouting({
  locales: ["en", "fa"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
