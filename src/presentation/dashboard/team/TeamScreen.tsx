import { useTranslations } from "next-intl";

import type { TeamMember } from "@/src/contracts/team-response-schema";
import type { ActivityEntryWire } from "@/src/presentation/dashboard/activity/activity-response-schema";

import { GrantAdminForm } from "./GrantAdminForm";
import { TeamActivity } from "./TeamActivity";
import { TeamTable } from "./TeamTable";

type TeamScreenProps = {
  /** Everyone who can reach the dashboard, fetched over the BFF during server render. */
  members: TeamMember[];
  /** Recent access changes from the activity log, newest first. */
  changes: ActivityEntryWire[];
};

/**
 * Admin team management. Presentational: the dashboard page fetches the members
 * over the REST API (BFF) during server render and passes them in; mutations
 * re-run that render via `router.refresh()`, so the server stays the single
 * source of truth and this screen holds no data state.
 */
export function TeamScreen({ members, changes }: TeamScreenProps) {
  const t = useTranslations("dashTeam");

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 sm:gap-8">
      <div className="space-y-2">
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">
          {t("summary", { count: members.length })}
        </p>
      </div>

      <GrantAdminForm />

      <TeamTable members={members} />

      <TeamActivity changes={changes} />
    </div>
  );
}
