import { z } from "zod";

/**
 * The shape the team endpoints promise to return, validated at the typed-service
 * boundary (see `parseApiResponse`).
 *
 * A team member is a `User` narrowed to what the page shows, plus two flags the
 * API computes from context the database doesn't hold: whether this row is the
 * signed-in admin (`isSelf`), and whether their access comes from the
 * `ADMIN_USER_IDS` environment allowlist (`breakGlass`). Both exist so the UI can
 * disable a Remove button that the server would refuse anyway.
 */
export const teamMemberResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable(),
  /** True when this member is the admin currently viewing the page. */
  isSelf: z.boolean(),
  /** True when access comes from the env allowlist and can't be revoked in the UI. */
  breakGlass: z.boolean(),
  /**
   * Whether Remove should be offered for this row. Computed server-side, because
   * every input to that decision is server-side: who you are, what's in the env
   * allowlist, and how many database admins remain. The client re-deriving it
   * meant two versions of one rule that disagreed — a break-glass admin inflated
   * the client's count, so it offered a Remove the server then refused.
   */
  revocable: z.boolean(),
});

export const teamMemberListResponseSchema = z.array(teamMemberResponseSchema);

/** One row of the dashboard's team table. */
export type TeamMember = z.infer<typeof teamMemberResponseSchema>;
