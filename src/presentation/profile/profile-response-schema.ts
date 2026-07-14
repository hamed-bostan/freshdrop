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

/**
 * `POST /images/upload` — the public URL of a stored image. The avatar flow saves
 * this URL straight onto the profile, so a body that isn't the expected envelope
 * would otherwise be persisted as `undefined`.
 */
export const imageUploadResponseSchema = z.object({
  image: z.object({ url: z.string().url() }),
});
