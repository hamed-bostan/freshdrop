import { requireAuth } from "@/src/lib/require-auth";

import type { ReactNode } from "react";

/**
 * Account area — requires a session. Unauthenticated visitors are redirected to
 * `/login?callbackUrl=…` and returned here afterwards. Storefront routes (home,
 * category, cart) stay public.
 */
export default async function ProfileLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
