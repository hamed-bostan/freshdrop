-- Give products a visibility state.
--
-- Until now every product in the table was, by definition, in the shop: the only
-- way to take one down was to delete it, which also destroys its stock ledger and
-- orphans the order lines that reference it. `is_published` separates "we no
-- longer sell this" from "this never existed".
--
-- DEFAULT true, and the backfill that follows from it, is the important part:
-- every existing product stays exactly as visible as it was, and a product created
-- without an opinion is live. Unpublished is a state an operator chooses, never
-- one a row falls into.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT true;

-- Every storefront read now carries `WHERE is_published = true` — the catalog
-- listing, search, the featured and special-offer rails, and the similar-products
-- rail. That predicate is on every one of those queries, so it gets an index.
-- CreateIndex
CREATE INDEX "products_is_published_idx" ON "products"("is_published");
