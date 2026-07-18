import { useTranslations } from "next-intl";
import { Badge } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { TeamMember } from "./team-response-schema";
import { RevokeAdminButton } from "./RevokeAdminButton";

type TeamTableProps = {
  /** Everyone who can reach the dashboard, in the order the API returned them. */
  members: TeamMember[];
};

/**
 * Shared grid template for the team list — the header row and every data row use
 * it so the columns line up. Columns: member, phone, access, actions.
 */
const TEAM_ROW_GRID = "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] items-center gap-4";

/**
 * The admin team list. Built on a shared CSS grid rather than a `<table>` so the
 * header and rows align on {@link TEAM_ROW_GRID}; scrolls horizontally on narrow
 * viewports rather than crushing the columns.
 *
 * A row's Remove button is omitted whenever the server would refuse the call
 * anyway — your own row, a break-glass admin, or the last remaining admin — so the
 * UI never offers an action that can only fail. Each case still carries a badge
 * explaining *why* there's nothing to click.
 */
export function TeamTable({ members }: TeamTableProps) {
  const t = useTranslations("dashTeam");
  const isLastAdmin = members.length <= 1;

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <div className="overflow-x-auto">
        <div className="min-w-[40rem]">
          <div
            className={cn(
              TEAM_ROW_GRID,
              "bg-surface-sunken px-4 py-3 text-body-b8 text-muted-foreground",
            )}
          >
            <span>{t("colMember")}</span>
            <span>{t("colPhone")}</span>
            <span>{t("colAccess")}</span>
            <span className="sr-only">{t("colActions")}</span>
          </div>
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className={cn(TEAM_ROW_GRID, "bg-background px-4 py-3")}>
                <span className="min-w-0 truncate text-body-b7 text-foreground">{member.name}</span>
                <span dir="ltr" className="truncate text-body-b6 text-muted-foreground">
                  {member.phone}
                </span>
                <span>
                  {member.breakGlass ? (
                    <Badge variant="warning">{t("badgeBreakGlass")}</Badge>
                  ) : member.isSelf ? (
                    <Badge variant="neutral">{t("badgeYou")}</Badge>
                  ) : (
                    <Badge variant="success">{t("badgeAdmin")}</Badge>
                  )}
                </span>
                <span className="flex justify-end">
                  {!member.isSelf && !member.breakGlass && !isLastAdmin && (
                    <RevokeAdminButton id={member.id} name={member.name} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
