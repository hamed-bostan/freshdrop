import { z } from "zod";
import type { User } from "@/src/domain/entities/User";

/**
 * The user as the profile screens see them: everything except `role`, which is an
 * access-control fact rather than part of the profile. The endpoint may serialize
 * it, but the schema strips it here so no client component can start branching on
 * a role read from a response body — authorization decisions belong on the server
 * (see `require-admin.ts`).
 */
export type UserProfile = Omit<User, "role">;

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
