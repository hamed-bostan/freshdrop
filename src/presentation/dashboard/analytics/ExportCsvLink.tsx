"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

type ExportCsvLinkProps = {
  /** Which export endpoint to hit — the resource segment under `/api/admin/exports/`. */
  resource: "orders" | "products" | "customers" | "inventory-movements";
  label: string;
  /** Denser report-card treatment; the default remains suitable for list toolbars. */
  compact?: boolean;
};

/**
 * "Export CSV" for an admin list, carrying that list's current filters.
 *
 * A plain anchor, not a fetch: the browser already knows how to stream a download
 * to disk with a progress indicator and a cancel button, and reproducing that with
 * `fetch` + a Blob would buffer the whole file in memory first — undoing the
 * streaming the endpoint exists to provide (see `csvStream`).
 *
 * Client-side only so it can read the live query string. That's what makes "respects
 * the current filters" true without every screen threading its params down: the
 * href *is* the list's URL pointed at the export endpoint, so whatever narrows the
 * table narrows the file, including filters added later.
 *
 * `page`/`pageSize` are stripped — an export is the whole filtered set, which is
 * precisely what the paged screen can't show you. The sort is kept, so the file
 * arrives in the order the admin arranged.
 */
export function ExportCsvLink({ resource, label, compact = false }: ExportCsvLinkProps) {
  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams);
  params.delete("page");
  params.delete("pageSize");
  const query = params.toString();

  return (
    <a
      href={`/api/admin/exports/${resource}${query ? `?${query}` : ""}`}
      // Advisory only — the server's `content-disposition` is what actually names
      // the file (and dates it). Present so the intent is visible in the markup.
      download
      className={cn(
        "flex items-center gap-2 border border-border text-foreground",
        compact
          ? "h-9 min-w-0 justify-start whitespace-nowrap rounded-card-md px-3 text-body-b10"
          : "h-11 rounded-button px-3 text-body-b7 sm:h-10",
        "transition-colors hover:bg-muted",
        focusRing,
      )}
    >
      <Icon icon={Download} size="xs" />
      {label}
    </a>
  );
}
