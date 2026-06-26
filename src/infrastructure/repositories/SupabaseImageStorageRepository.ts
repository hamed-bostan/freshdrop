import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  IImageStorageRepository,
  StoredImage,
  UploadImageInput,
} from "@/src/domain/repositories/IImageStorageRepository";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export interface SupabaseImageStorageConfig {
  /** Project URL, e.g. `https://xxxx.supabase.co`. */
  url: string;
  /**
   * Service-role (secret) key. Bypasses RLS — MUST stay server-side only. The
   * repository is bound into route handlers via the container, never imported
   * by client components.
   */
  serviceRoleKey: string;
  /** Storage bucket name. */
  bucket: string;
}

/**
 * Image storage backed by Supabase Storage. Runs server-side only — it holds the
 * service-role key, which is what lets it write to the bucket while RLS keeps the
 * client (anon key) read-only. The bucket is public, so reads need no key at all.
 */
export class SupabaseImageStorageRepository implements IImageStorageRepository {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(config: SupabaseImageStorageConfig) {
    this.bucket = config.bucket;
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async upload(input: UploadImageInput): Promise<StoredImage> {
    const extension = EXTENSION_BY_MIME[input.contentType];
    if (!extension) {
      throw new Error(`SupabaseImageStorage: unsupported content type "${input.contentType}".`);
    }

    const path = buildObjectPath(input.folder, extension);

    const { error } = await this.client.storage.from(this.bucket).upload(path, input.data, {
      contentType: input.contentType,
      // Generated paths are unique, so this never clobbers; keep it explicit.
      upsert: false,
    });

    if (error) {
      throw new Error(`SupabaseImageStorage: upload failed — ${error.message}`);
    }

    return { path, url: this.getPublicUrl(path) };
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new Error(`SupabaseImageStorage: remove failed — ${error.message}`);
    }
  }

  getPublicUrl(path: string): string {
    return this.client.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }
}

/** `<folder>/<uuid>.<ext>`, with the folder segment omitted when not given. */
function buildObjectPath(folder: string | undefined, extension: string): string {
  const name = `${crypto.randomUUID()}.${extension}`;
  const segment = folder?.replace(/^\/+|\/+$/g, "");
  return segment ? `${segment}/${name}` : name;
}
