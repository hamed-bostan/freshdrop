import { NextResponse, type NextRequest } from "next/server";
import { SweepOrphanImages } from "@/src/domain/use-cases/images/SweepOrphanImages";
import { categoryRepository, imageStorageRepository } from "@/src/infrastructure/container";
import { isAuthorizedForCron } from "@/src/lib/cron-auth";
import { MANAGED_IMAGE_FOLDERS } from "@/src/lib/imageFolders";

// Reads the DB + bucket on every call; never cache or statically analyse it.
export const dynamic = "force-dynamic";

const DEFAULT_MAX_AGE_HOURS = 24;

/**
 * Orphan-image sweep: `POST /api/admin/images/sweep`. Deletes bucket objects no
 * entity references and that are older than the safety window (so a half-filled
 * form's upload is never reclaimed). Authorised by an admin session OR a cron
 * bearer secret. Pass `?dryRun=1` to preview without deleting.
 *
 * Wire to a host cron on the VPS, e.g. (daily):
 *   curl -fsS -X POST -H "Authorization: Bearer $IMAGE_SWEEP_SECRET" \
 *     https://nearfood.ir/api/admin/images/sweep
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedForCron(request, "catalog.write", process.env.IMAGE_SWEEP_SECRET))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const olderThanMs = maxAgeHours() * 60 * 60 * 1000;

  const sweep = new SweepOrphanImages(imageStorageRepository, [
    async () => (await categoryRepository.getAll()).map((category) => category.iconUrl),
  ]);

  try {
    const result = await sweep.execute({ folders: MANAGED_IMAGE_FOLDERS, olderThanMs, dryRun });
    if (result.failed.length > 0) {
      console.error("Image sweep: some objects failed to delete:", result.failed);
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Image sweep failed:", error);
    return NextResponse.json({ error: "Image sweep failed." }, { status: 500 });
  }
}

/** Optional `IMAGE_SWEEP_MAX_AGE_HOURS` override, falling back to the safe default. */
function maxAgeHours(): number {
  const raw = Number(process.env.IMAGE_SWEEP_MAX_AGE_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_AGE_HOURS;
}
