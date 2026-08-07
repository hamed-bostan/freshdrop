"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button } from "@/src/presentation/design-system";

import { reviewsApi } from "../review-api";

import { AddReviewSheet, type ReviewDraft } from "./AddReviewSheet";
import { ReviewSubmittedModal } from "./ReviewSubmittedModal";

interface AddReviewFlowProps {
  /** The product the review is written for. */
  productId: string;
}

/**
 * Drives the "Add Review" flow: a trigger button → the review form sheet →
 * a success modal. Submitting POSTs the review over the REST API (author taken from
 * the session server-side); the review starts pending admin approval, so it won't
 * show in the list yet — we refresh the RSC (harmless, keeps the page current) and
 * show the confirmation, which sets that expectation. A 401 means the user isn't
 * signed in.
 */
export function AddReviewFlow({ productId }: AddReviewFlowProps) {
  const t = useTranslations("reviews");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [submittedRating, setSubmittedRating] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(draft: ReviewDraft) {
    setError(null);
    startTransition(async () => {
      try {
        await reviewsApi.create({ productId, rating: draft.rating, comment: draft.feedback });
        // The server persisted the review; re-run the server render so the list
        // reflects it, then surface the confirmation.
        router.refresh();
        setSubmittedRating(draft.rating);
        setSheetOpen(false);
        setSuccessOpen(true);
      } catch (err) {
        setError(
          // 401 keeps the feature's own copy (a sign-in prompt beats the generic
          // "not authorized"); everything else resolves through the shared map.
          err instanceof ApiError && err.status === 401
            ? t("signInError")
            : localizeApiError(err, tApiErrors, t("genericError")),
        );
      }
    });
  }

  return (
    <>
      <Button variant="link" className="mx-auto" onClick={() => setSheetOpen(true)}>
        {t("add")}
      </Button>

      <AddReviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleSubmit}
        pending={pending}
        error={error}
      />

      <ReviewSubmittedModal open={successOpen} onOpenChange={setSuccessOpen} rating={submittedRating} />
    </>
  );
}
