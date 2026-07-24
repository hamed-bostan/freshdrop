import { z } from "zod";
import { ADMIN_SEARCH_GROUPS } from "@/src/domain/entities/AdminSearchResults";

/**
 * Wire shape of `GET /api/admin/search` — flat and pre-shaped for display, never
 * a raw entity: a hit is `{id, title, subtitle, href}` regardless of which
 * entity it came from, so the command palette renders one shape for all of them.
 */
const adminSearchHitSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string(),
});

const adminSearchGroupSchema = z.object({
  type: z.enum(ADMIN_SEARCH_GROUPS),
  items: z.array(adminSearchHitSchema),
});

export const adminSearchResponseSchema = z.object({
  groups: z.array(adminSearchGroupSchema),
  /** True when any included group hit its cap — there may be more matches than shown. */
  truncated: z.boolean(),
});

export type AdminSearchHit = z.infer<typeof adminSearchHitSchema>;
export type AdminSearchGroup = z.infer<typeof adminSearchGroupSchema>;
export type AdminSearchResponse = z.infer<typeof adminSearchResponseSchema>;
