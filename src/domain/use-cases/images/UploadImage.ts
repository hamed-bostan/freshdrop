import type {
  IImageStorageRepository,
  StoredImage,
  UploadImageInput,
} from "../../repositories/IImageStorageRepository";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
/** Mirrors the bucket's server-side limit (5 MB) so we fail fast and cheaply. */
const MAX_BYTES = 5 * 1024 * 1024;

export class UploadImage {
  constructor(private readonly imageStorage: IImageStorageRepository) {}

  execute(input: UploadImageInput): Promise<StoredImage> {
    if (!ALLOWED_CONTENT_TYPES.has(input.contentType)) {
      throw new Error(`UploadImage: unsupported content type "${input.contentType}".`);
    }

    const byteLength = input.data.byteLength;
    if (byteLength === 0) {
      throw new Error("UploadImage: image is empty.");
    }
    if (byteLength > MAX_BYTES) {
      throw new Error(`UploadImage: image exceeds the ${MAX_BYTES} byte limit.`);
    }

    return this.imageStorage.upload(input);
  }
}
