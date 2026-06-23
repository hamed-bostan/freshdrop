"use client";

import * as React from "react";
import { Button, RatingStars, Sheet, SheetContent, Textarea } from "@/src/presentation/design-system";

export interface ReviewDraft {
  rating: number;
  feedback: string;
}

interface AddReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: ReviewDraft) => void;
}

/**
 * Bottom sheet that collects a star rating and optional written feedback.
 * Controlled via `open`; resets itself each time it closes. A rating is
 * required before the review can be submitted.
 */
export function AddReviewSheet({ open, onOpenChange, onSubmit }: AddReviewSheetProps) {
  const [rating, setRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");

  // Clear the form when the sheet closes so it opens fresh next time.
  React.useEffect(() => {
    if (!open) {
      setRating(0);
      setFeedback("");
    }
  }, [open]);

  const canSubmit = rating > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ rating, feedback: feedback.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Add Your Review" description="Rate the product and share your feedback.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <RatingStars
            value={rating}
            onChange={setRating}
            size="lg"
            label="Your rating"
            className="justify-center"
          />

          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Add Feedback"
            aria-label="Feedback"
            className="h-40"
          />

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            Submit
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
