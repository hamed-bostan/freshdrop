import type { AdminSearchGroupType } from "@/src/domain/entities/AdminSearchResults";

const STORAGE_PREFIX = "freshdrop:admin-search-recents:";
const MAX_RECENTS = 8;

export type RecentSearch = {
  id: string;
  type: AdminSearchGroupType;
  title: string;
  subtitle: string;
  href: string;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** A user's recent search picks, most recent first. Empty on the server or when storage is unavailable. */
export function loadRecentSearches(userId: string): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

/** Record a pick as the most recent, de-duplicated by `href` and capped at {@link MAX_RECENTS}. */
export function pushRecentSearch(userId: string, entry: RecentSearch): RecentSearch[] {
  const next = [entry, ...loadRecentSearches(userId).filter((item) => item.href !== entry.href)].slice(0, MAX_RECENTS);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch {
      // Storage full or unavailable (private browsing) — recents are a convenience, not a requirement.
    }
  }
  return next;
}
