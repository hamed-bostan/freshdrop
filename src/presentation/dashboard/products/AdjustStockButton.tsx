"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  stockAdjustmentSchema,
  STOCK_ADJUSTMENT_DIRECTIONS,
  type StockAdjustmentInput,
} from "@/src/contracts/stock-adjustment-schema";
import { ADMIN_STOCK_MOVEMENT_REASONS } from "@/src/domain/entities/StockMovement";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatNumber } from "@/src/lib/formatNumber";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import {
  Button,
  FormMessage,
  Input,
  Modal,
  ModalContent,
  Icon,
  Select,
  TextField,
} from "@/src/presentation/design-system";

import { productsApi } from "./product-api";

type AdjustStockButtonProps = {
  id: string;
  name: string;
  /** Units on hand right now — the starting point the preview counts from. */
  stockQuantity: number;
  trigger?: "button" | "none";
  /** Visible copy turns the compact product-list icon into an inventory workflow action. */
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Fields the API can return targeted `fieldErrors` for. */
const FORM_FIELDS = ["amount", "reason", "note"] as const;

/**
 * Row action that adjusts one product's stock without leaving the list.
 *
 * Restocking is the overwhelmingly common case, so the form opens ready for it —
 * direction "add", reason "restock", the amount box focused — which makes a
 * delivery two interactions from the list: open, type the count, save. Everything
 * else (removing shrinkage, fixing a miscount) is the same form with the defaults
 * changed.
 *
 * It's a modal rather than an inline editable cell on purpose: a number that
 * commits on blur can't ask *why* it changed, and the reason is the whole point of
 * the ledger behind this. Deliberately not the full edit form either — that would
 * re-send every field of a product nobody is editing, and clobber a change someone
 * else saved in the meantime.
 */
export function AdjustStockButton({
  id,
  name,
  stockQuantity,
  trigger = "button",
  triggerLabel,
  open: controlledOpen,
  onOpenChange,
}: AdjustStockButtonProps) {
  const t = useTranslations("dashProducts");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  const locale = useLocale();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;

  const fieldError = (message?: string): string | undefined => formErrorMessage(tFormErrors, message);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema, undefined, { raw: true }),
    defaultValues: { direction: "add", amount: "", reason: "restock", note: "" },
  });

  // The running preview of what the shelf will hold. Read from the live form
  // values rather than recomputed on submit, so the operator sees the consequence
  // of the number they're typing before they commit to it — the one thing a bare
  // "+/- N" box never tells you.
  const direction = useWatch({ control, name: "direction" });
  const amount = Number(useWatch({ control, name: "amount" }));
  const delta = Number.isFinite(amount) && amount > 0 ? (direction === "remove" ? -amount : amount) : 0;
  const projected = stockQuantity + delta;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await productsApi.adjustStock(id, values);
      setOpen(false);
      reset();
      // Re-run the server render so the row's stock badge — and the list, if a
      // stock filter is active and this product just left it — reflects the
      // change. The server stays the source of truth; no local list patching.
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("adjustError") });
        return;
      }
      // Prefer field-level messages so they read in context; fall back to one root
      // message when the API didn't scope the failure — which is where removing
      // more units than are on hand lands, since a 409 describes the state of the
      // shelf rather than a bad value in any one box.
      let appliedField = false;
      for (const field of FORM_FIELDS) {
        const message = error.fieldErrors?.[field];
        if (message) {
          setError(field, { message });
          appliedField = true;
        }
      }
      if (!appliedField) {
        setError("root", { message: localizeApiError(error, tApiErrors, t("adjustError")) });
      }
    }
  });

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    // Drop a half-typed adjustment (and any stale error) once the modal closes, so
    // reopening it never offers a number the operator already walked away from.
    if (!next) reset();
  }

  function setOpen(next: boolean): void {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <>
      {trigger === "button" ? (
        <Button
          type="button"
          variant={triggerLabel ? "outline" : "ghost"}
          size="sm"
          iconOnly={!triggerLabel}
          aria-label={t("adjustAria", { name })}
          onClick={() => setOpen(true)}
        >
          <Icon icon={PackagePlus} size="sm" />
          {triggerLabel ? <span className="ms-1.5">{triggerLabel}</span> : null}
        </Button>
      ) : null}

      <Modal open={open} onOpenChange={handleOpenChange}>
        <ModalContent title={t("adjustTitle")} description={t("adjustDescription", { name })}>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
            <p className="text-body-b6 text-muted-foreground">
              {t("adjustCurrent", { name, count: formatNumber(stockQuantity, locale) })}
            </p>

            <div className="flex gap-3">
              <TextField
                label={t("adjustDirectionLabel")}
                className="flex-1"
                error={fieldError(errors.direction?.message)}
              >
                {(control) => (
                  <Select {...control} {...register("direction")}>
                    {STOCK_ADJUSTMENT_DIRECTIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`adjustDirection.${value}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </TextField>

              <TextField
                label={t("adjustAmountLabel")}
                className="flex-1"
                error={fieldError(errors.amount?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...register("amount")}
                    // `inputMode` gives phones the numeric keypad without the
                    // spinner arrows a `type="number"` would add to a field that
                    // is typed, not stepped.
                    inputMode="numeric"
                    autoFocus
                    placeholder={t("adjustAmountPlaceholder")}
                  />
                )}
              </TextField>
            </div>

            {delta !== 0 && (
              <p className="text-body-b7 text-foreground">
                {t("adjustPreview", { count: formatNumber(Math.max(0, projected), locale) })}
              </p>
            )}

            <TextField label={t("adjustReasonLabel")} error={fieldError(errors.reason?.message)} required>
              {(control) => (
                <Select {...control} {...register("reason")}>
                  {ADMIN_STOCK_MOVEMENT_REASONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`adjustReason.${value}`)}
                    </option>
                  ))}
                </Select>
              )}
            </TextField>

            <TextField
              label={t("adjustNoteLabel")}
              description={t("adjustNoteDescription")}
              error={fieldError(errors.note?.message)}
              {...register("note")}
              placeholder={t("adjustNotePlaceholder")}
            />

            {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {t("adjustConfirm")}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
