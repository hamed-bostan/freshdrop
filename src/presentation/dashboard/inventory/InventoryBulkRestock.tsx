"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus } from "lucide-react";
import {
  stockAdjustmentSchema,
  type StockAdjustmentInput,
} from "@/src/contracts/stock-adjustment-schema";
import {
  Button,
  FormMessage,
  Input,
  Modal,
  ModalContent,
  Icon,
  TextField,
} from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import { useBulkSelection } from "@/src/presentation/dashboard/bulk";
import { productsApi } from "@/src/presentation/dashboard/products/product-api";

/**
 * Bulk restock: add the same count of units, for the same reason, to every
 * selected product in one action — a delivery that restocks a dozen items at
 * once, rather than opening `AdjustStockButton` on each row in turn.
 *
 * Deliberately not a new domain concept: this fires the existing
 * `PATCH /api/products/:id/stock` once per selected id (`Promise.allSettled`,
 * so one product's failure — say, it was deleted a moment ago — doesn't block
 * the rest), the same ledgered path a single-row adjustment takes. There is no
 * bulk endpoint and no bulk use-case; `AdjustStock` already is the atomic unit,
 * one call per product, exactly like `applyBulkChange` writes one audit entry
 * per product rather than one for the batch.
 *
 * Fixed at `direction: "add"`, `reason: "restock"` — the two things a restocking
 * round always is. Removing stock or recording shrinkage across a selection is
 * `AdjustStockButton`'s job, one product at a time, because those are corrections
 * that belong with their own reasoning per item, not a round applied uniformly.
 */
export function InventoryBulkRestock() {
  const t = useTranslations("dashInventory");
  const tProducts = useTranslations("dashProducts");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  const router = useRouter();
  const { selected, clear } = useBulkSelection();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema, undefined, { raw: true }),
    defaultValues: { direction: "add", amount: "", reason: "restock", note: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const results = await Promise.allSettled(
      selected.map((id) => productsApi.adjustStock(id, values)),
    );
    const failed = results.filter((result) => result.status === "rejected").length;

    if (failed === 0) {
      setOpen(false);
      reset();
      router.refresh();
      clear();
      return;
    }

    if (failed === results.length) {
      const firstError = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
      const message =
        firstError.reason instanceof ApiError
          ? localizeApiError(firstError.reason, tApiErrors, t("bulkRestockError"))
          : t("bulkRestockError");
      setError("root", { message });
      return;
    }

    // Some succeeded, some didn't: refresh so the ones that landed show their new
    // level, but keep the modal open with a count so the operator knows to retry
    // the rest rather than assuming the whole batch went through.
    router.refresh();
    setError("root", { message: t("bulkRestockPartialError", { failed, total: results.length }) });
  });

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) reset();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Icon icon={PackagePlus} size="sm" className="me-1.5" />
        {t("bulkRestockButton")}
      </Button>

      <Modal open={open} onOpenChange={handleOpenChange}>
        <ModalContent
          title={t("bulkRestockTitle")}
          description={t("bulkRestockDescription", { count: selected.length })}
        >
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
            <TextField
              label={t("bulkRestockAmountLabel")}
              error={formErrorMessage(tFormErrors, errors.amount?.message)}
              required
            >
              {(control) => (
                <Input
                  {...control}
                  {...register("amount")}
                  inputMode="numeric"
                  autoFocus
                  placeholder={tProducts("adjustAmountPlaceholder")}
                />
              )}
            </TextField>

            <TextField
              label={tProducts("adjustNoteLabel")}
              description={tProducts("adjustNoteDescription")}
              error={formErrorMessage(tFormErrors, errors.note?.message)}
              {...register("note")}
              placeholder={tProducts("adjustNotePlaceholder")}
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
                {tProducts("cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {t("bulkRestockConfirm")}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
