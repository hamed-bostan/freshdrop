/**
 * The bucket sub-folders the app uploads into — and, by the same token, the only
 * folders the orphan sweep scans. Shared so the upload allowlist and the sweep
 * can never drift apart.
 */
export const MANAGED_IMAGE_FOLDERS = ["products", "categories", "misc"] as const;

export type ManagedImageFolder = (typeof MANAGED_IMAGE_FOLDERS)[number];
