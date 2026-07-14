import { z } from "zod";
import type { User } from "@/src/domain/entities/User";

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
}) satisfies z.ZodType<User>;
