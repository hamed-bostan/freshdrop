"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Icon, Modal, ModalContent, RatingStars } from "@/src/presentation/design-system";

interface ReviewSubmittedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The rating the user submitted, shown back to them. */
  rating: number;
}

/**
 * Centered success modal shown after a review is submitted: a check badge,
 * a "Done!" message and the rating the user just gave.
 */
export function ReviewSubmittedModal({ open, onOpenChange, rating }: ReviewSubmittedModalProps) {
  const t = useTranslations("reviews");

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent title={t("doneTitle")} hideTitle description={t("doneDescription")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-full border-2 border-primary" aria-hidden>
            <Icon icon={Check} size="lg" className="text-primary" />
          </span>

          <div className="flex flex-col gap-1">
            <p className="text-heading-h2 text-foreground">{t("doneTitle")}</p>
            <p className="text-body-b6 text-muted-foreground">{t("doneBody")}</p>
          </div>

          <RatingStars value={rating} size="md" />
        </div>
      </ModalContent>
    </Modal>
  );
}
