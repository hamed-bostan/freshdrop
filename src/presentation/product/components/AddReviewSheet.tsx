"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { Button, FormMessage, RatingStars, Sheet, SheetContent, Textarea } from "@/src/presentation/design-system";

export interface ReviewDraft {
  rating: number;
  feedback: string;
}

interface AddReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: ReviewDraft) => void;
  /** True while the submission is in flight — disables the submit button. */
  pending?: boolean;
  /** A submission error to surface (e.g. "sign in to review"); the sheet stays open. */
  error?: string | null;
}

/**
 * Bottom sheet that collects a star rating and optional written feedback.
 * Controlled via `open`; resets itself each time it closes. A rating is
 * required before the review can be submitted.
 */
export function AddReviewSheet({ open, onOpenChange, onSubmit, pending = false, error = null }: AddReviewSheetProps) {
  const t = useTranslations("reviews");
  const [rating, setRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");

  // Clear the form when the sheet closes so it opens fresh next time.
  React.useEffect(() => {
    if (!open) {
      setRating(0);
      setFeedback("");
    }
  }, [open]);

  const canSubmit = rating > 0 && !pending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating <= 0 || pending) return;
    onSubmit({ rating, feedback: feedback.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t("sheetTitle")} description={t("sheetDescription")}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <RatingStars
            value={rating}
            onChange={setRating}
            size="lg"
            label={t("yourRating")}
            className="justify-center"
          />

          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder={t("feedbackPlaceholder")}
            aria-label={t("feedbackLabel")}
            className="h-40"
          />

          {error && (
            <FormMessage size="md" className="text-center">{error}</FormMessage>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
