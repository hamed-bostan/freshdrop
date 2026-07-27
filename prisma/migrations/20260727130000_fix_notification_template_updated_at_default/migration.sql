-- The previous migration gave `updated_at` a DB-level DEFAULT, but every other
-- `@updatedAt` column in this schema has none (Prisma Client sets it on write,
-- not the database) — that mismatch is what `prisma migrate dev` was
-- detecting as drift. Bring the column in line with the schema.

-- AlterTable
ALTER TABLE "notification_templates" ALTER COLUMN "updated_at" DROP DEFAULT;
