import { apiDelete, apiPost } from "@/src/lib/api/client";
import { teamMemberResponseSchema, type TeamMember } from "./team-response-schema";
import type { GrantAdminInput } from "./team-schema";

/**
 * Typed client for the team REST *mutations*. UI components call these instead of
 * touching Axios directly; each method resolves with the row shape or rejects with
 * an `ApiError` — either normalized from the failure (see `client.ts`) or raised
 * because the response body didn't match `teamMemberResponseSchema`.
 * Reads are server-side (see `teamServerApi`).
 */
export const teamApi = {
  grant(values: GrantAdminInput): Promise<TeamMember> {
    return apiPost("/admin/team", values, teamMemberResponseSchema);
  },

  revoke(id: string): Promise<void> {
    return apiDelete(`/admin/team/${id}`);
  },
};
