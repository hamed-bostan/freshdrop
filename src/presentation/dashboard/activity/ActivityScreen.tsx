import { getTranslations } from "next-intl/server";
import { ACTIVITY_ENTITY_TYPES } from "@/src/domain/entities/ActivityEntry";
import type { Page } from "@/src/domain/entities/Pagination";
import { ListFilterSelect, ListPager, ListToolbar } from "@/src/presentation/dashboard/list";
import { ActivityList } from "./ActivityList";
import type { ActivityActorWire, ActivityEntryWire } from "./activity-response-schema";

type ActivityScreenProps = {
  /** One page of the log, newest first. */
  entries: Page<ActivityEntryWire>;
  /** The people who appear in the log, for the actor filter. */
  actors: ActivityActorWire[];
  /** Whether a filter is narrowing the log, to tell "nothing here" from "nothing matched". */
  isFiltered: boolean;
};

/**
 * The admin audit trail: every change anyone made, newest first, filterable by who
 * made it and what kind of thing it was made to.
 *
 * Presentational, and a server component: the filters and the page live in the
 * URL, so changing either is a navigation that re-runs the server render. Nothing
 * here holds data state, and nothing here writes — the log has no controls at all,
 * which is the design.
 *
 * There is no search box. The log's text is a rendering of actions and ids, not
 * prose, so a free-text search over it would mostly match on fragments of uuids;
 * the two filters that matter — who, and what kind of thing — are exact.
 */
export async function ActivityScreen({ entries, actors, isFiltered }: ActivityScreenProps) {
  const t = await getTranslations("dashActivity");
  const tList = await getTranslations("dashList");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary")}</p>
      </div>

      <ListToolbar
        filters={
          <>
            <ListFilterSelect
              paramName="actorId"
              label={t("filterActor")}
              options={[
                { value: "", label: t("allActors") },
                ...actors.map((actor) => ({ value: actor.id, label: actor.name })),
              ]}
            />
            <ListFilterSelect
              paramName="entityType"
              label={t("filterEntity")}
              options={[
                { value: "", label: t("allEntities") },
                ...ACTIVITY_ENTITY_TYPES.map((type) => ({
                  value: type,
                  label: t(`entity.${type}`),
                })),
              ]}
            />
          </>
        }
      />

      {entries.items.length > 0 ? (
        <>
          <ActivityList entries={entries.items} />
          <ListPager page={entries} />
        </>
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : t("empty")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : t("emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
