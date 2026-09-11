/** A successfully stored file. */
export type StoredFile = {
  /** Path within the bucket, e.g. `<jobId>/orders-2026-08-06.xlsx`. */
  path: string;
};

/** An object discovered by listing the bucket (used by the expiry sweep). */
export type StoredFileObject = {
  path: string;
  createdAt: Date | null;
};

export type UploadFileInput = {
  data: ArrayBuffer | Uint8Array;
  contentType: string;
  /** Full path within the bucket, chosen by the caller (not generated here). */
  path: string;
};

/**
 * Boundary between the app and whatever object-storage provider holds
 * generated export files. A separate port from `IImageStorageRepository`,
 * not a widened one: that port validates against an image MIME allowlist and
 * only ever produces public URLs (the bucket is public), both of which are
 * exactly wrong for export files — they're CSV/XLSX/PDF and must be private,
 * time-limited downloads. Implementations live in `infrastructure` and are
 * bound in the container, so swapping providers never touches the domain or UI.
 */
export type IFileStorageRepository = {
  /** Store file bytes at the given path (the caller owns naming/uniqueness). */
  upload(input: UploadFileInput): Promise<StoredFile>;

  /**
   * A time-limited download URL for a private object — what `GetExportJobDownload`
   * hands back instead of a public link, and what an emailed "secure link" is.
   */
  createSignedUrl(path: string, expiresInSeconds: number): Promise<string>;

  /** Delete a previously stored object by its bucket path. */
  remove(path: string): Promise<void>;

  /** List every object under a bucket folder (paginated internally) — the expiry sweep. */
  list(folder: string): Promise<StoredFileObject[]>;
};
