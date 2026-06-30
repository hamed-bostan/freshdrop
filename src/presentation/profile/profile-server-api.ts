import type { User } from "@/src/domain/entities/User";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side profile read for Server Components (BFF). `serverApiGet` forwards
 * the request cookies, so this resolves the caller's own profile.
 */
export const profilesServerApi = {
  /** The signed-in user's profile (get-or-create, so it always resolves for a session). */
  getMe(): Promise<User> {
    return serverApiGet<User>("/profile");
  },
};
