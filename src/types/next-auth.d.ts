import type { DefaultSession } from "next-auth";

/**
 * Expose the user's id on the session. Auth.js v5 doesn't surface it by default;
 * the `session` callback in `auth.ts` copies it from `token.sub` so
 * `requireAdmin()` can match it against the `ADMIN_USER_IDS` allowlist. (Module
 * augmentation must use `interface` for declaration merging.)
 */
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
