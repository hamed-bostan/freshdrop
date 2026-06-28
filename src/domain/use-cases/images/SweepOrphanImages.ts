import type { IImageStorageRepository } from "../../repositories/IImageStorageRepository";

/**
 * Yields every image URL a part of the app currently references and therefore
 * must be kept. One per entity that stores images (today: categories); add more
 * as other entities move off mock data. A source throwing aborts the whole sweep
 * before anything is deleted — losing a keep-list must never cause data loss.
 */
export type ReferencedUrlSource = () => Promise<readonly string[]>;

export type SweepOrphanImagesOptions = {
  /** Bucket folders to scan. */
  folders: readonly string[];
  /**
   * Only objects older than this are eligible for removal. This is the guard that
   * protects images uploaded for a form that hasn't been submitted yet — set it
   * comfortably longer than a user could spend filling the form.
   */
  olderThanMs: number;
  /** When true, report what *would* be removed without deleting anything. */
  dryRun?: boolean;
}

export type SweepOrphanImagesResult = {
  /** Total objects examined across all folders. */
  scanned: number;
  /** Paths identified as orphaned and old enough to remove. */
  orphaned: string[];
  /** Paths actually removed (empty on a dry run). */
  removed: string[];
  /** Paths whose removal failed — surfaced so the caller can log/alert. */
  failed: string[];
  dryRun: boolean;
}

/**
 * Reconciles the image bucket against what the app references, deleting objects
 * nothing points at. This is the backstop that catches orphans inline cleanup
 * can't: uploads for an abandoned form, or a best-effort delete that failed.
 * Eventually-consistent and self-healing — safe to run on a schedule.
 */
export class SweepOrphanImages {
  constructor(
    private readonly imageStorage: IImageStorageRepository,
    private readonly referenceSources: readonly ReferencedUrlSource[],
  ) {}

  async execute(options: SweepOrphanImagesOptions): Promise<SweepOrphanImagesResult> {
    const { folders, olderThanMs, dryRun = false } = options;

    // 1. Build the keep-list (referenced paths) first. If any source throws, the
    //    error propagates and we never reach the deletion step below.
    const referenced = new Set<string>();
    for (const source of this.referenceSources) {
      for (const url of await source()) {
        const path = this.imageStorage.pathForUrl(url);
        if (path) referenced.add(path);
      }
    }

    // 2. Walk the managed folders; an object is an orphan when nothing references
    //    it AND it's old enough that it can't be an in-flight upload.
    const cutoff = Date.now() - olderThanMs;
    const orphaned: string[] = [];
    let scanned = 0;

    for (const folder of folders) {
      for (const object of await this.imageStorage.list(folder)) {
        scanned += 1;
        if (referenced.has(object.path)) continue;
        // Unknown age → treat as too-new and leave it; never delete on a guess.
        if (!object.createdAt || object.createdAt.getTime() > cutoff) continue;
        orphaned.push(object.path);
      }
    }

    // 3. Remove (unless this is a dry run). Per-object best-effort: one failure
    //    must not abort the rest of the sweep.
    const removed: string[] = [];
    const failed: string[] = [];
    if (!dryRun) {
      for (const path of orphaned) {
        try {
          await this.imageStorage.remove(path);
          removed.push(path);
        } catch {
          failed.push(path);
        }
      }
    }

    return { scanned, orphaned, removed, failed, dryRun };
  }
}
