"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

type ExportCsvLinkProps = {
  /** Which export endpoint to hit — the resource segment under `/api/admin/exports/`. */
  resource: "orders" | "products" | "customers" | "inventory-movements";
  label: string;
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
export function ExportCsvLink({ resource, label }: ExportCsvLinkProps) {
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
        "flex h-9 items-center gap-2 rounded-button border border-border px-3 text-body-b7 text-foreground",
        "transition-colors hover:bg-muted",
        focusRing,
      )}
    >
      <Icon icon={Download} size="xs" />
      {label}
    </a>
  );
}
