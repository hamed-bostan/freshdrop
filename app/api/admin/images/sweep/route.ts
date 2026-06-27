import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SweepOrphanImages } from "@/src/domain/use-cases/images/SweepOrphanImages";
import { categoryRepository, imageStorageRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
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
  if (!(await isAuthorized(request))) {
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

/** Admins may run it (and dry-run it); automation uses the `IMAGE_SWEEP_SECRET` bearer. */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await getAdminSession()) return true;

  const secret = process.env.IMAGE_SWEEP_SECRET;
  if (!secret) return false; // No secret configured → only an admin session is accepted.

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return constantTimeEquals(token, secret);
}

/** Optional `IMAGE_SWEEP_MAX_AGE_HOURS` override, falling back to the safe default. */
function maxAgeHours(): number {
  const raw = Number(process.env.IMAGE_SWEEP_MAX_AGE_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_AGE_HOURS;
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
