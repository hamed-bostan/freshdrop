import { NextResponse, type NextRequest } from "next/server";
import { UploadImage } from "@/src/domain/use-cases/images/UploadImage";
import { imageStorageRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { MANAGED_IMAGE_FOLDERS } from "@/src/lib/imageFolders";

const ALLOWED_FOLDERS = new Set<string>(MANAGED_IMAGE_FOLDERS);

/**
 * Image upload endpoint: `POST /api/images/upload` with `multipart/form-data`
 * (`file`, optional `folder`). The actual write to Supabase Storage happens here,
 * server-side, using the service-role key (see `SupabaseImageStorageRepository`).
 *
 * Admin-only: it writes to a public, billable bucket with the service-role key,
 * so it must never be reachable by anonymous callers.
 */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
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
