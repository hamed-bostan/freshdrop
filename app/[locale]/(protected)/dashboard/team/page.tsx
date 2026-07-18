import { teamServerApi } from "@/src/presentation/dashboard/team/team-server-api";
import { TeamScreen } from "@/src/presentation/dashboard/team/TeamScreen";

// Who holds admin access is read from the REST API (BFF) per request — never
// statically cached, so a grant or revoke shows up on the next render.
export const dynamic = "force-dynamic";

export default async function DashboardTeamPage() {
  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin team endpoint authorizes the call.
  const members = await teamServerApi.list();

  return <TeamScreen members={members} />;
}
