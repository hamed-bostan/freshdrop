import { z } from "zod";
import type { User } from "@/src/domain/entities/User";

/**
 * The user as the profile screens see them: everything except `role` (an
 * access-control fact, not part of the profile — see `require-admin.ts`) and
 * `notifiedCategories` (an admin-only bell preference; the storefront profile
 * screen has no notion of it, and it never travels to a customer response).
 */
export type UserProfile = Omit<User, "role" | "notifiedCategories">;

/**
 * The shapes the profile endpoints promise to return, validated at the typed-service
 * boundary (see `parseApiResponse`).
 */
export const userResponseSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
}) satisfies z.ZodType<UserProfile>;
