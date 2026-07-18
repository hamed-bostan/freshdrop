import { serverApiGet } from "@/src/lib/api/server-client";
import { teamMemberListResponseSchema, type TeamMember } from "./team-response-schema";
import {
  roleChangeListResponseSchema,
  type RoleChangeEntry,
} from "./team-history-response-schema";

/**
 * Server-side team read for the admin dashboard (BFF). `serverApiGet` forwards the
 * admin's session cookie so the admin endpoint authorizes the call.
 */
export const teamServerApi = {
  list(): Promise<TeamMember[]> {
    return serverApiGet("/admin/team", teamMemberListResponseSchema);
  },

  /** Recent dashboard access changes, newest first. */
  listHistory(): Promise<RoleChangeEntry[]> {
    return serverApiGet("/admin/team/history", roleChangeListResponseSchema);
  },
};
