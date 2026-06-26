/**
 * Turn a human name into a URL-safe slug: lowercase, ampersands → "and",
 * runs of non-alphanumerics → single hyphens, trimmed of leading/trailing
 * hyphens. Pure — safe on both server and client.
 *
 * @example slugify("Meat & Fish") // "meat-and-fish"
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
