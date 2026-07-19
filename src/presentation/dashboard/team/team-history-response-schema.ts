import { z } from "zod";
import type { RoleChange } from "@/src/domain/entities/RoleChange";

/**
 * The wire form of a `RoleChange`: the entity as-is, except `at` crosses as an ISO
 * string. The route builds it by spreading the entity, so naming the difference
 * here — rather than restating the whole shape — is what lets `satisfies` below
 * catch a field added to or renamed on the entity at compile time.
 */
export type RoleChangeWire = Omit<RoleChange, "at"> & { at: string };

/**
 * The shape the team history endpoint promises to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 *
 * `at` stays an ISO string rather than being transformed to a `Date`: both things
 * that consume it — `formatRelativeTime` and the `<time dateTime>` attribute —
 * want the string, so parsing it here would only mean converting it straight
 * back. (A transforming schema also can't satisfy `serverApiGet`, which requires
 * one input type and output type.)
 *
 * `satisfies` ties it to the domain entity the same way the other response schemas
 * do, so drift fails the build instead of surfacing as a parse error in the admin's
 * face. Without it this schema was the only statement of the shape, and the route's
 * `{ ...change }` spread meant a renamed entity field would quietly stop arriving.
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
}) satisfies z.ZodType<RoleChangeWire>;

export const roleChangeListResponseSchema = z.array(roleChangeResponseSchema);

/** One entry in the team's activity list. */
export type RoleChangeEntry = z.infer<typeof roleChangeResponseSchema>;
