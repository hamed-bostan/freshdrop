import { NextResponse, type NextRequest } from "next/server";
import { UploadImage } from "@/src/domain/use-cases/images/UploadImage";
import { imageStorageRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { getUserSession } from "@/src/lib/require-auth";
import { AVATAR_IMAGE_FOLDER, MANAGED_IMAGE_FOLDERS } from "@/src/lib/imageFolders";

const ADMIN_FOLDERS = new Set<string>(MANAGED_IMAGE_FOLDERS);
const ALLOWED_FOLDERS = new Set<string>([...MANAGED_IMAGE_FOLDERS, AVATAR_IMAGE_FOLDER]);

/**
 * Image upload endpoint: `POST /api/images/upload` with `multipart/form-data`
 * (`file`, optional `folder`). The actual write to Supabase Storage happens here,
 * server-side, using the service-role key (see `SupabaseImageStorageRepository`).
 *
 * Authorization is per-folder: the catalog folders (products/categories/misc)
 * are admin-only — they back the storefront and feed the orphan sweep. The
 * `avatars` folder is open to any signed-in user uploading their own profile
 * picture. Anonymous callers can never write to a billable, service-role bucket.
 */
export async function POST(request: NextRequest) {
  // Decide which session this caller has up front; the folder check below picks
  // the right requirement. (Admins satisfy the user check too.)
  const [adminSession, userSession] = await Promise.all([getAdminSession(), getUserSession()]);
  if (!adminSession && !userSession) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file'." }, { status: 400 });
  }

  const folderRaw = formData.get("folder");
  const folder = typeof folderRaw === "string" && folderRaw ? folderRaw : undefined;
  if (folder && !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: `Unknown folder "${folder}".` }, { status: 400 });
  }

  // An unspecified folder (or any managed catalog folder) is admin-only; only the
  // `avatars` folder is reachable by a non-admin signed-in user.
  if ((!folder || ADMIN_FOLDERS.has(folder)) && !adminSession) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const image = await new UploadImage(imageStorageRepository).execute({
      data: await file.arrayBuffer(),
      contentType: file.type,
      folder,
      fileName: file.name,
    });
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Image upload failed." }, { status: 502 });
  }
}
