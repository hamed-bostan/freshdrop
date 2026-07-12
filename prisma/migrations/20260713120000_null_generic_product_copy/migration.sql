-- The initial product seed backfilled every row's detail / nutrition / origin
-- columns with generic, auto-generated filler: the nutrition text is byte-identical
-- across the whole catalog, and description / origin are templated from the product
-- name + category. That copy is UI boilerplate, not authored catalog data, so it no
-- longer belongs in the data layer — `ProductInfoAccordion` now renders a localized
-- fallback (en / fa) for any section without stored text. Null the filler so only
-- genuinely authored rows keep their stored copy and everything else falls through to
-- the localized fallback. The WHERE clauses match only the templated boilerplate, so
-- bespoke rows (e.g. the cage-free eggs) are left untouched.

UPDATE "products"
  SET "nutrition" = NULL
  WHERE "nutrition" LIKE 'Nutritional values vary by serving size%Best enjoyed as part of a balanced diet.';

UPDATE "products"
  SET "description" = NULL
  WHERE "description" LIKE '%a quality pick from our %range, sourced for freshness and everyday value.';

UPDATE "products"
  SET "origin" = NULL
  WHERE "origin" LIKE 'Responsibly sourced and quality-checked before reaching our %shelves.';
