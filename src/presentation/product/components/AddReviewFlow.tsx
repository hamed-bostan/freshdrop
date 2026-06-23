"use client";

import * as React from "react";
import { Button } from "@/src/presentation/design-system";
import { AddReviewSheet, type ReviewDraft } from "./AddReviewSheet";
import { ReviewSubmittedModal } from "./ReviewSubmittedModal";

/**
 * Drives the "Add Review" flow: a trigger button → the review form sheet →
 * a success modal. Submission is UI-only for now (no SubmitReview use-case yet).
 */
export function AddReviewFlow() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [submittedRating, setSubmittedRating] = React.useState(0);

  function handleSubmit(draft: ReviewDraft) {
    // TODO: dispatch a SubmitReview use-case once the review write path exists.
    setSubmittedRating(draft.rating);
    setSheetOpen(false);
    setSuccessOpen(true);
  }

  return (
    <>
      <Button variant="link" className="mx-auto" onClick={() => setSheetOpen(true)}>
        Add Review
      </Button>

      <AddReviewSheet open={sheetOpen} onOpenChange={setSheetOpen} onSubmit={handleSubmit} />

      <ReviewSubmittedModal open={successOpen} onOpenChange={setSuccessOpen} rating={submittedRating} />
    </>
  );
}
