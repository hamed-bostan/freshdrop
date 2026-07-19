import { useLocale, useTranslations } from "next-intl";
import { roleChangeKind } from "@/src/domain/entities/RoleChange";
import type { Locale } from "@/src/i18n/routing";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import { DataTable } from "@/src/presentation/design-system";
import type { RoleChangeEntry } from "./team-history-response-schema";

type TeamActivityProps = {
  /** Recent access changes, newest first. */
  changes: RoleChangeEntry[];
};

/**
 * The audit trail for dashboard access: who changed whose role, and when.
 *
 * Read-only and append-only — there is deliberately nothing here to edit or
 * clear, since a record an admin can quietly tidy up isn't one. Names come from
 * the entry rather than from the current team, so history stays truthful about
 * people who have since been renamed or removed.
 */
export function TeamActivity({ changes }: TeamActivityProps) {
  const t = useTranslations("dashTeam");
  const locale = useLocale() as Locale;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-body-b4 text-foreground">{t("activityHeading")}</h2>
        <p className="text-body-b6 text-muted-foreground">{t("activityDescription")}</p>
      </div>

      {changes.length === 0 ? (
        <p className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center text-body-b6 text-muted-foreground">
          {t("activityEmpty")}
        </p>
      ) : (
        // The frame is the same card the admin tables sit in; the rows inside are
        // an ordered list, not a table — a log entry is one sentence, not columns.
        <DataTable>
          <ol className="divide-y divide-border">
            {changes.map((change) => (
              <li
                key={change.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-background px-4 py-3"
              >
                <span className="text-body-b6 text-foreground">
                  {t(`activity.${roleChangeKind(change)}`, {
                    user: change.userName,
                    actor: change.actorName,
                  })}
                  {/* The name alone doesn't identify anyone until they've completed
                      their profile — everyone granted access before their first
                      sign-in carries the same placeholder. The id is their phone,
                      which does identify them. */}
                  <span dir="ltr" className="ms-2 text-body-b10 text-muted-foreground">
                    {change.userId}
                  </span>
                </span>
                <time dateTime={change.at} className="text-body-b10 text-muted-foreground">
                  {formatRelativeTime(change.at, locale)}
                </time>
              </li>
            ))}
          </ol>
        </DataTable>
      )}
    </section>
  );
}
