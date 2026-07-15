import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation primitives — drop-in replacements for `next/link` and
// `next/navigation` that preserve the active locale (adding the `/fa` prefix when
// needed). Components import `Link`/`useRouter`/`usePathname` from here, never from
// `next/link` or `next/navigation`, so internal navigation never loses the locale.
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
