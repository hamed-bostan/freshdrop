"use server";

import { cookies } from "next/headers";
import { ONBOARDED_COOKIE } from "@/src/lib/onboarding";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Marks onboarding as complete by setting the gate cookie server-side.
 *
 * Server-set + `httpOnly` makes the flag authoritative (the middleware that
 * trusts it owns it, rather than relying on a client-written cookie). When auth
 * lands, this should move to a `user.onboardedAt` field on the account so the
 * state follows the user across devices instead of living on one browser.
 */
export async function completeOnboarding() {
  const cookieStore = await cookies();

  cookieStore.set(ONBOARDED_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}
