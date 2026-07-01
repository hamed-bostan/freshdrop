"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@/src/domain/entities/Review";
import { ApiError } from "@/src/lib/api/ApiError";
import { cn } from "@/src/lib/utils";
import { reviewsApi } from "./review-api";

/**
 * The moderation decisions an admin can make (mirrors `reviewModerationSchema`).
 * "Pending" isn't here — it's the submission-time default, not something the
 * moderator sets; a pending review shows the placeholder below until decided.
 */
type ModerationDecision = Exclude<ReviewStatus, "pending">;

const DECISIONS: { value: ModerationDecision; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Native-select styling matching the DS field family (same as OrderStageSelect). */
const SELECT_CLASSES =
  "h-9 rounded-input border border-border bg-input px-2.5 text-body-b7 text-input-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type ReviewStatusSelectProps = {
  id: string;
  status: ReviewStatus;
};

/**
 * Per-row moderation control. Changing the select writes the new status over the
 * REST API, then `router.refresh()` re-runs the server render so the queue (and
 * the storefront) reflect it — the server stays the source of truth, no local
 * copy to keep in sync. A failed write reverts (the select falls back to the
 * server `status`) and shows inline.
 */
export function ReviewStatusSelect({ id, status }: ReviewStatusSelectProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const next = event.target.value as ModerationDecision;
    if (next === status) return;

    setError(null);
    startTransition(async () => {
      try {
        await reviewsApi.setStatus(id, { status: next });
        router.refresh();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Couldn't update the review. Please try again.";
        setError(message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        className={cn(SELECT_CLASSES, status === "pending" && "text-muted-foreground")}
        value={status === "pending" ? "" : status}
        onChange={handleChange}
        disabled={pending}
        aria-label="Moderate review"
      >
        {status === "pending" && (
          <option value="" disabled>
            Moderate…
          </option>
        )}
        {DECISIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="max-w-48 text-right text-body-b10 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
