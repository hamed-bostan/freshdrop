import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Badge, Button, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { TeamMember } from "./team-response-schema";
import { RevokeAdminButton } from "./RevokeAdminButton";
import { TransferOwnershipButton } from "./TransferOwnershipButton";

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
 * Removal availability is decided server-side and arrives as `revokeBlocked`:
 * re-deriving it here meant two copies of one rule, and they disagreed as soon as
 * a break-glass admin was in the list. A blocked row keeps a disabled button
 * carrying the reason, so "why can't I remove this person?" is answerable from
 * the table rather than by reading the source.
 */
export function TeamTable({ members }: TeamTableProps) {
  const t = useTranslations("dashTeam");
  // Taking ownership means three different things depending on the situation —
  // claiming a vacant seat, taking it off a sitting owner, or handing it over —
  // and each needs its own confirmation. These decide only which copy to show;
  // the server still decides what's permitted.
  const hasOwner = members.some((member) => member.role === "owner");

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
                {/* "(you)" belongs on the name, not in the Access column — it isn't
                    an access level, and putting it there made the column look like
                    it held two different kinds of thing. */}
                <span className="min-w-0 truncate text-body-b7 text-foreground">
                  {member.name}
                  {member.isSelf && (
                    <span className="ms-1 text-muted-foreground">{t("youSuffix")}</span>
                  )}
                </span>
                <span dir="ltr" className="truncate text-body-b6 text-muted-foreground">
                  {member.phone}
                </span>
                {/* The badge is the role and nothing else. Where the grant is stored
                    is metadata about the row, so it sits underneath as a note —
                    rendering "Server config" as a peer of "Admin" implied they were
                    two different access levels, which they never were. */}
                <span className="flex flex-col items-start gap-1">
                  {member.role === "owner" ? (
                    <Badge variant="warning">{t("badgeOwner")}</Badge>
                  ) : (
                    <Badge variant="success">{t("badgeAdmin")}</Badge>
                  )}
                  {member.breakGlass && (
                    <span className="text-body-b10 text-muted-foreground">{t("managedInEnv")}</span>
                  )}
                </span>
                <span className="flex justify-end gap-1">
                  {member.transferable && (
                    <TransferOwnershipButton
                      id={member.id}
                      name={member.name}
                      intent={
                        !member.isSelf ? "transfer" : hasOwner ? "takeOver" : "claim"
                      }
                    />
                  )}
                  {member.revokeBlocked === null ? (
                    <RevokeAdminButton id={member.id} name={member.name} />
                  ) : (
                    // Not rendered for your own row — nobody looks for a button to
                    // remove themselves. For the others the button stays, disabled,
                    // carrying the reason: a silently missing control just reads as
                    // a bug.
                    member.revokeBlocked !== "self" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled
                        aria-label={t(`revokeBlocked.${member.revokeBlocked}`)}
                        title={t(`revokeBlocked.${member.revokeBlocked}`)}
                      >
                        <Icon icon={Trash2} size="sm" />
                      </Button>
                    )
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
