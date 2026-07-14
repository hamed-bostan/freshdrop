import type { User } from "@/src/domain/entities/User";
import { apiPut } from "@/src/lib/api/client";
import { AVATAR_IMAGE_FOLDER } from "@/src/lib/imageFolders";
import { imagesApi } from "@/src/presentation/images/image-api";
import { userResponseSchema } from "./profile-response-schema";
import type { ProfileUpdateValues } from "./profile-schema";

/**
 * Typed client for the profile REST endpoint. UI components call these instead of
 * touching Axios directly; each method resolves with domain data — validated against
 * the endpoint's response schema — or rejects with an `ApiError`. The read is
 * server-side (see `profilesServerApi`).
 */
export const profilesApi = {
  update(values: ProfileUpdateValues): Promise<User> {
    return apiPut("/profile", values, userResponseSchema);
  },

  /**
   * Upload a new avatar image and return its public URL. Goes through the shared
   * image-upload service (Supabase, `avatars` folder); the returned URL is then
   * saved on the profile via {@link update}.
   */
  uploadAvatar(file: File): Promise<string> {
    return imagesApi.upload(file, AVATAR_IMAGE_FOLDER);
  },
};
