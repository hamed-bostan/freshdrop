import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  IFileStorageRepository,
  StoredFile,
  StoredFileObject,
  UploadFileInput,
} from "@/src/domain/repositories/IFileStorageRepository";

/** Supabase Storage's `list` caps each page at 100 objects. */
const LIST_PAGE_SIZE = 100;

export interface SupabaseFileStorageConfig {
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
 * Export file storage backed by Supabase Storage. A separate bucket and a
 * separate implementation from `SupabaseImageStorageRepository` on purpose:
 * that bucket is public and image-only; this one holds admin-only report
 * files (CSV/XLSX/PDF) and must be **private**, so every read goes through a
 * time-limited signed URL rather than a public one. Create the `exports`
 * bucket as private in the Supabase dashboard before this is used.
 */
export class SupabaseFileStorageRepository implements IFileStorageRepository {
  private clientInstance: SupabaseClient | null = null;

  constructor(private readonly config: SupabaseFileStorageConfig) {}

  /**
   * Built on first use, not in the constructor — see
   * `SupabaseImageStorageRepository` for why (so `next build` never needs the
   * runtime Supabase env).
   */
  private get client(): SupabaseClient {
    if (!this.clientInstance) {
      const { url, serviceRoleKey } = this.config;
      if (!url || !serviceRoleKey) {
        throw new Error("SupabaseFileStorage: SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use file storage.");
      }
      this.clientInstance = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.clientInstance;
  }

  async upload(input: UploadFileInput): Promise<StoredFile> {
    const { error } = await this.client.storage.from(this.config.bucket).upload(input.path, input.data, {
      contentType: input.contentType,
      // Generated paths include the job id, so this never clobbers; keep it explicit.
      upsert: false,
    });

    if (error) {
      throw new Error(`SupabaseFileStorage: upload failed — ${error.message}`);
    }

    return { path: input.path };
  }

  async createSignedUrl(path: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.client.storage.from(this.config.bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      throw new Error(`SupabaseFileStorage: sign failed for "${path}" — ${error?.message ?? "no data"}`);
    }
    return data.signedUrl;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.config.bucket).remove([path]);
    if (error) {
      throw new Error(`SupabaseFileStorage: remove failed — ${error.message}`);
    }
  }

  async list(folder: string): Promise<StoredFileObject[]> {
    const bucket = this.client.storage.from(this.config.bucket);
    const objects: StoredFileObject[] = [];

    for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
      const { data, error } = await bucket.list(folder, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        throw new Error(`SupabaseFileStorage: list failed for "${folder}" — ${error.message}`);
      }
      if (!data || data.length === 0) break;

      for (const item of data) {
        // Sub-folder placeholders come back with a null id and no metadata — skip them.
        if (!item.id) continue;
        objects.push({
          path: `${folder}/${item.name}`,
          createdAt: item.created_at ? new Date(item.created_at) : null,
        });
      }

      if (data.length < LIST_PAGE_SIZE) break;
    }

    return objects;
  }
}
