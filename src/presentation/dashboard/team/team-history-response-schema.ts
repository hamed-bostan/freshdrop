import { z } from "zod";

/**
 * The shape the team history endpoint promises to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 *
 * `at` stays an ISO string rather than being transformed to a `Date`: both things
 * that consume it — `formatRelativeTime` and the `<time dateTime>` attribute —
 * want the string, so parsing it here would only mean converting it straight
 * back. (A transforming schema also can't satisfy `serverApiGet`, which requires
 * one input type and output type.)
 */
export const roleChangeResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  fromRole: z.enum(["customer", "admin", "owner"]),
  toRole: z.enum(["customer", "admin", "owner"]),
  at: z.string(),
});

export const roleChangeListResponseSchema = z.array(roleChangeResponseSchema);

/** One entry in the team's activity list. */
export type RoleChangeEntry = z.infer<typeof roleChangeResponseSchema>;
