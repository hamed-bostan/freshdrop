import type { User } from "@/src/domain/entities/User";
import { apiClient } from "@/src/lib/api/client";
import { AVATAR_IMAGE_FOLDER } from "@/src/lib/imageFolders";
import type { ProfileUpdateValues } from "./profile-schema";

/**
 * Typed client for the profile REST endpoint. UI components call these instead of
 * touching Axios directly; each method resolves with domain data or rejects with
 * an `ApiError` (normalized by the response interceptor in `client.ts`). The read
 * is server-side (see `profilesServerApi`).
 */
export const profilesApi = {
  async update(values: ProfileUpdateValues): Promise<User> {
    const { data } = await apiClient.put<User>("/profile", values);
    return data;
  },

  /**
   * Upload a new avatar image and return its public URL. Goes through the shared
   * image-upload endpoint (Supabase, `avatars` folder); the returned URL is then
   * saved on the profile via {@link update}.
   */
  async uploadAvatar(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", AVATAR_IMAGE_FOLDER);

    const { data } = await apiClient.post<{ image: { url: string } }>("/images/upload", body);
    return data.image.url;
  },
};
