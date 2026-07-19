-- Append-only log of every admin-visible change: who did it, when, to which
-- thing, and what the value was before. Never updated or deleted.
--
-- This generalises `role_changes`, which recorded dashboard-access grants and
-- nothing else — one log per feature answers "who changed this?" differently for
-- each feature, and not at all for the ones without a log. Those entries are
-- backfilled below and the old table is dropped, so there is exactly one log.
--
-- `actor_id` and `entity_id` are plain references, not foreign keys — the same
-- loose coupling used throughout, and necessarily so here: an entry has to
-- outlive the thing it describes, which is the entire point of a `product.deleted`
-- row. Names are snapshotted for the same reason.

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    -- Action and entity type are plain strings matching the domain unions
    -- (the schema is enum-free); the adapter narrows them on read.
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_label" TEXT,
    -- `[{ "field": …, "before": …, "after": … }]`, values already rendered as
    -- strings or null. Read whole with its entry, never queried across entries.
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- The diff is a list of changes, so anything that isn't a JSON array is a bug in
-- a writer rather than an unusual entry. Checked here because Prisma's `Json`
-- type can hold any JSON value and the readers assume an array.
ALTER TABLE "activity_log"
    ADD CONSTRAINT "activity_log_changes_is_array" CHECK (jsonb_typeof("changes") = 'array');

-- CreateIndex
-- The unfiltered log, newest first.
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");
-- One entity's own history — the panels on the order and product detail screens.
CREATE INDEX "activity_log_entity_type_entity_id_created_at_idx" ON "activity_log"("entity_type", "entity_id", "created_at");
-- The actor filter, and the "what did this person do" question behind it.
CREATE INDEX "activity_log_actor_id_created_at_idx" ON "activity_log"("actor_id", "created_at");

-- Fold the existing access history in rather than starting the log empty. These
-- entries are the record of who has held admin and ownership; dropping the table
-- without carrying them across would destroy exactly the history the log exists
-- to keep. Ids and timestamps are preserved, so nothing is re-dated and a link to
-- an old entry still resolves.
INSERT INTO "activity_log" (
    "id", "actor_id", "actor_name", "action", "entity_type", "entity_id",
    "entity_label", "changes", "created_at"
)
SELECT
    "id",
    "actor_id",
    "actor_name",
    'user.roleChanged',
    'user',
    "user_id",
    "user_name",
    jsonb_build_array(
        jsonb_build_object('field', 'role', 'before', "from_role", 'after', "to_role")
    ),
    "created_at"
FROM "role_changes";

-- DropTable
-- Safe now that every row above has an equivalent entry in `activity_log`.
DROP TABLE "role_changes";
