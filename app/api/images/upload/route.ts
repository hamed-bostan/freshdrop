import { NextResponse, type NextRequest } from "next/server";
import { UploadImage } from "@/src/domain/use-cases/images/UploadImage";
import { imageStorageRepository } from "@/src/infrastructure/container";

const ALLOWED_FOLDERS = new Set(["products", "categories", "misc"]);

/**
 * Image upload endpoint: `POST /api/images/upload` with `multipart/form-data`
 * (`file`, optional `folder`). The actual write to Supabase Storage happens here,
 * server-side, using the service-role key (see `SupabaseImageStorageRepository`).
 */
export async function POST(request: NextRequest) {
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
