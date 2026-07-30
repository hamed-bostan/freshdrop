"use client";

import * as React from "react";
import { Check, EllipsisVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReviewStatus } from "@/src/domain/entities/Review";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  FormMessage,
  Icon,
} from "@/src/presentation/design-system";
import { reviewsApi } from "./review-api";

type ModerationDecision = Exclude<ReviewStatus, "pending">;

type ReviewModerationActionsProps = {
  id: string;
  status: ReviewStatus;
  authorName: string;
};

/**
 * Keeps the common moderation path visible without repeating the current status
 * in a select. Secondary and reversal actions live in a command menu.
 */
export function ReviewModerationActions({ id, status, authorName }: ReviewModerationActionsProps) {
  const t = useTranslations("dashReviews");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function apply(nextStatus: ModerationDecision): void {
    if (nextStatus === status || pending) return;

    setError(null);
    startTransition(async () => {
      try {
        await reviewsApi.setStatus(id, { status: nextStatus });
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("updateError")));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        {status === "pending" ? (
          <Button size="sm" loading={pending} onClick={() => apply("approved")}>
            <Icon icon={Check} size="sm" className="me-1.5" />
            {t("approveAction")}
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuIconTrigger
            aria-label={t("rowActionsAria", { name: authorName })}
            disabled={pending}
          >
            <EllipsisVertical aria-hidden className="size-4" />
          </DropdownMenuIconTrigger>
          <DropdownMenuContent>
            {status !== "approved" ? (
              <DropdownMenuItem onSelect={() => apply("approved")}>
                <Icon icon={Check} size="sm" />
                {t("approveAction")}
              </DropdownMenuItem>
            ) : null}
            {status !== "rejected" ? (
              <DropdownMenuItem destructive onSelect={() => apply("rejected")}>
                <Icon icon={X} size="sm" />
                {t("rejectAction")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error ? <FormMessage className="max-w-48 text-end">{error}</FormMessage> : null}
    </div>
  );
}
