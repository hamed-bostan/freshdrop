/** A successfully stored image. */
export interface StoredImage {
  /** Path within the bucket, e.g. `products/3f9a…​.webp`. */
  path: string;
  /** Public CDN URL the client can render directly. */
  url: string;
}

export interface UploadImageInput {
  /** Raw image bytes. */
  data: ArrayBuffer | Uint8Array;
  /** MIME type, e.g. `image/webp`. Used for validation and the stored object. */
  contentType: string;
  /** Optional sub-folder inside the bucket, e.g. `products`. */
  folder?: string;
  /** Original filename — only the extension is used to name the stored object. */
  fileName?: string;
}

/**
 * Boundary between the app and whatever object-storage provider holds images.
 * Implementations live in `infrastructure` and are bound in the container, so
 * swapping Supabase Storage for S3/R2 never touches the domain or UI.
 */
export interface IImageStorageRepository {
  /** Store image bytes and return its path + public URL. */
  upload(input: UploadImageInput): Promise<StoredImage>;
  /** Delete a previously stored object by its bucket path. */
  remove(path: string): Promise<void>;
  /** Resolve a bucket path to its public URL without a round-trip. */
  getPublicUrl(path: string): string;
}
