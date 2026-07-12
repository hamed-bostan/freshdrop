import { defineRouting } from "next-intl/routing";

// Locale routing config, shared by the middleware, the navigation helpers, and the
// request config. English is the default and stays un-prefixed (existing URLs are
// unchanged); Persian is served under `/fa` (`localePrefix: "as-needed"`).
export const routing = defineRouting({
  locales: ["en", "fa"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
