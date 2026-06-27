-- Repoint category icons from the bundled /public/images/* files to Supabase
-- Storage, where the icons now live (bucket `images`, folder `categories`).
--
-- Authored by hand rather than by editing 0_init: that migration is already
-- applied in prod, and `prisma migrate deploy` rejects modified-after-apply
-- migrations. This runs as a fresh migration instead — idempotent, since it
-- derives each URL from the row's slug (matching the uploaded file names) and
-- simply mirrors the one-off UPDATE already run against prod.
UPDATE "categories"
SET "icon_url" =
      'https://idcwhbjnvkoihxwjebxm.supabase.co/storage/v1/object/public/images/categories/'
      || "slug" || '.png',
    "updated_at" = CURRENT_TIMESTAMP;
