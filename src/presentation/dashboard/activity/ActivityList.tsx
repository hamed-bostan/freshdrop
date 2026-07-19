import { getLocale, getTranslations } from "next-intl/server";
import { roleChangeKind } from "@/src/domain/entities/RoleChange";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { DataTable } from "@/src/presentation/design-system";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import { activityEntityHref } from "./activityLinks";
import type { ActivityEntryWire } from "./activity-response-schema";

type ActivityListProps = {
  entries: ActivityEntryWire[];
  /**
   * Whether to name the entity in each row. Off inside a per-entity panel, where
   * every row is about the same thing and repeating its name down the column says
   * nothing.
   */
  showEntity?: boolean;
};

/**
 * The activity log rendered as a list of sentences with their diffs.
 *
 * Shared by the activity page and the per-entity panels so an entry reads the same
 * wherever it's shown. Deliberately an ordered list inside the admin card frame
 * rather than a table — the same call `TeamActivity` and `StockMovementHistory`
 * make, and for the same reason: a log entry is one sentence plus a small diff,
 * and columns wide enough for a product name and a description are columns mostly
 * full of whitespace.
 *
 * Read-only, and there is nothing here to edit or delete. A record an admin can
 * quietly tidy up isn't one.
 */
export async function ActivityList({ entries, showEntity = true }: ActivityListProps) {
  const t = await getTranslations("dashActivity");
  const locale = (await getLocale()) as Locale;

  return (
    <DataTable>
      <ol className="divide-y divide-border">
        {entries.map((entry) => {
          const href = activityEntityHref(entry.entityType, entry.entityId, entry.action);
          const label = entry.entityLabel ?? entry.entityId;

          // Role changes get the sentence the team page always used ("X gave Y
          // admin access") rather than the generic "X changed Y", because the
          // roles carry the meaning and a diff reading `customer → admin` makes
          // the reader do the translation themselves.
          const sentence =
            entry.action === "user.roleChanged"
              ? t(
                  `role.${roleChangeKind({
                    userId: entry.entityId,
                    actorId: entry.actorId,
                    changes: entry.changes,
                  })}`,
                  { actor: entry.actorName, user: label },
                )
              : t(`action.${entry.action}`, { actor: entry.actorName, entity: label });

          return (
            <li key={entry.id} className="flex flex-col gap-1.5 bg-background px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-body-b6 text-foreground">
                  {sentence}
                  {showEntity && href ? (
                    <Link href={href} className="ms-2 text-body-b10 text-primary hover:underline">
                      {t("open")}
                    </Link>
                  ) : null}
                </span>
                <time dateTime={entry.at} className="text-body-b10 text-muted-foreground">
                  {formatRelativeTime(entry.at, locale)}
                </time>
              </div>

              {entry.changes.length > 0 ? (
                <ActivityDiff
                  changes={entry.changes}
                  fieldLabel={(field) => fieldLabel(t as unknown as LooseTranslator, field)}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </DataTable>
  );
}

/**
 * The fields that moved, as `label: before → after`.
 *
 * `before` is struck through rather than merely placed first: the whole reason to
 * open this log is to find a value that used to be something else, and the eye
 * should land on which of the two is gone without reading the arrow.
 *
 * A `null` side reads as an em dash — "not set", which is different from empty and
 * different from zero, and the three are worth telling apart when the field is a
 * price.
 */
function ActivityDiff({
  changes,
  fieldLabel,
}: {
  changes: ActivityEntryWire["changes"];
  fieldLabel: (field: string) => string;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {changes.map((change) => (
        <li key={change.field} className="flex flex-wrap items-baseline gap-x-2 text-body-b10">
          <span className="text-muted-foreground">{fieldLabel(change.field)}</span>
          {change.before !== null ? (
            <span className="text-muted-foreground line-through">{change.before}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <span aria-hidden className="text-muted-foreground rtl:-scale-x-100">
            →
          </span>
          <span className="text-foreground">{change.after ?? "—"}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The translator, seen through a signature that accepts a runtime-built key.
 *
 * next-intl types `t` and `t.has` against the literal keys in `messages/*.json`,
 * which is exactly what we want everywhere else and can't work here: the key comes
 * from a `field` string chosen by a use-case, and the whole point of `has` is to
 * ask about a key that might not exist. The cast is confined to this one lookup
 * and is checked at runtime by the `has` call it enables.
 */
type LooseTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/**
 * A readable name for a diffed field, falling back to the raw key.
 *
 * The fallback is what keeps this from being a maintenance trap: a use-case that
 * starts recording a new field renders it as `nutritionNotes` — ugly, but present
 * and honest — instead of throwing a missing-message error that takes the whole
 * page down. Translating it is then a follow-up, not a prerequisite.
 */
function fieldLabel(t: LooseTranslator, field: string): string {
  const key = `field.${field}`;
  return t.has(key) ? t(key) : field;
}
