"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { useBulkSelection } from "@/src/presentation/dashboard/bulk";
import { Button, Icon } from "@/src/presentation/design-system";

import { reviewsApi } from "./review-api";

/**
 * The moderation queue's bulk actions: approve or reject the selection.
 *
 * Only the two decisions a moderator makes — there's no bulk "back to pending",
 * because pending is the state a review arrives in rather than a verdict, and
 * undoing a moderation is a per-review reconsideration, not a batch.
 *
 * Reads the selection from context rather than taking it as props: the bar around
 * it is rendered from a Server Component, which can't hand a client component a
 * callback (see `BulkActionBar`).
 */
export function ReviewBulkActions() {
  const t = useTranslations("dashReviews");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const { selected, clear } = useBulkSelection();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function apply(status: "approved" | "rejected"): void {
    setError(null);
    startTransition(async () => {
      try {
        await reviewsApi.bulkSetStatus(selected, status);
        // The queue's tab counts move too, and they're computed server-side — so
        // the whole segment re-renders rather than the rows being patched here.
        router.refresh();
        clear();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("bulkError")));
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => apply("approved")}>
        <Icon icon={Check} size="sm" className="me-1.5" />
        {t("bulkApprove")}
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => apply("rejected")}>
        <Icon icon={X} size="sm" className="me-1.5" />
        {t("bulkReject")}
      </Button>

      {error ? <span className="text-body-b6 text-destructive">{error}</span> : null}
    </>
  );
}
