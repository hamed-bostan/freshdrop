import {
  ACTIVITY_ENTITY_TYPES,
  type ActivityEntityType,
  type ActivityFilters,
} from "@/src/domain/entities/ActivityEntry";

/**
 * The wire contract for the activity log's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-review-params.ts`.
 *
 * Query-param names: `actorId`, `entityType`, `entityId`.
 *
 * `action` is deliberately not a query param. The page filters by *what was
 * changed*, not by which of the twelve verbs was used, and offering both would be
 * two dropdowns whose combinations are mostly empty. The port still supports it
 * for the callers that need one action (the team page's role history).
 */

const ENTITY_TYPE_SET = new Set<string>(ACTIVITY_ENTITY_TYPES);

export function parseAdminActivityFilters(params: URLSearchParams): ActivityFilters {
  const filters: ActivityFilters = {};

  const actorId = params.get("actorId")?.trim();
  if (actorId) filters.actorId = actorId;

  // Unrecognised values are dropped rather than answered with a 400, the rule
  // every list param follows: a stale or hand-edited URL lands on a sane
  // unfiltered page instead of an error screen.
  const entityType = params.get("entityType");
  if (entityType && ENTITY_TYPE_SET.has(entityType)) {
    filters.entityType = entityType as ActivityEntityType;
  }

  const entityId = params.get("entityId")?.trim();
  if (entityId) filters.entityId = entityId;

  return filters;
}

export function buildAdminActivityParams(filters: ActivityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.entityId) params.set("entityId", filters.entityId);
  return params;
}
