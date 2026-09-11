"use client";

import { CheckCircle2, Download, TriangleAlert, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, DataTable, FormMessage, Icon } from "@/src/presentation/design-system";

import { productImportApi } from "./product-import-api";

import type { ProductImportCommitResponse, ProductImportValidationResponse } from "./product-import-response-schema";

type Phase = "idle" | "validating" | "validated" | "committing" | "done";

/**
 * The bulk product-import flow: pick a CSV, validate it (writes nothing),
 * review the report, then confirm the commit. Two separate network calls
 * rather than one "upload and go" request — `CreateProduct`/`UpdateProduct`
 * have far more ways to fail per row than a bulk-edit field, so the admin
 * sees every row's fate before anything is written, not after row 180 of 200.
 *
 * `commit` sends back exactly the `valid` rows `validate` returned, not the
 * file again — the report on screen is what gets written, not a fresh read of
 * a file that could have changed on disk in between.
 */
export function ProductImportPanel(): React.ReactElement {
  const t = useTranslations("dashProductImport");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [validation, setValidation] = React.useState<ProductImportValidationResponse | null>(null);
  const [commitResult, setCommitResult] = React.useState<ProductImportCommitResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    setFile(picked);
    setValidation(null);
    setCommitResult(null);
    setError(null);
    setPhase("idle");
  }

  async function validate(): Promise<void> {
    if (!file) return;
    setError(null);
    setPhase("validating");
    try {
      setValidation(await productImportApi.validate(file));
      setPhase("validated");
    } catch (err) {
      setError(localizeApiError(err, tApiErrors, t("validateError")));
      setPhase("idle");
    }
  }

  async function commit(): Promise<void> {
    if (!validation || validation.valid.length === 0) return;
    setError(null);
    setPhase("committing");
    try {
      setCommitResult(await productImportApi.commit(validation.valid));
      setPhase("done");
      router.refresh();
    } catch (err) {
      setError(localizeApiError(err, tApiErrors, t("commitError")));
      setPhase("validated");
    }
  }

  function reset(): void {
    setFile(null);
    setValidation(null);
    setCommitResult(null);
    setError(null);
    setPhase("idle");
  }

  const busy = phase === "validating" || phase === "committing";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="dashboard-page-title">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          {/* A file download, not a page navigation — a plain anchor lets the
              browser stream it to disk, same reasoning as `ExportCsvLink`. */}
          <a href="/api/admin/imports/products/template" download>
            <Icon icon={Download} size="sm" className="me-1.5" />
            {t("downloadTemplate")}
          </a>
        </Button>
      </div>

      <div className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center">
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={pickFile} />
        <Icon icon={UploadCloud} size="md" className="mx-auto text-icon-muted" />
        <p className="mt-3 text-body-b6 text-foreground">{file ? file.name : t("noFileChosen")}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {t("chooseFile")}
          </Button>
          <Button type="button" size="sm" disabled={!file || busy} loading={phase === "validating"} onClick={validate}>
            {t("validate")}
          </Button>
        </div>
      </div>

      {error ? <FormMessage>{error}</FormMessage> : null}

      {validation ? (
        <div className="flex flex-col gap-4">
          <p className="text-body-b6 text-foreground">
            {t("validationSummary", { total: validation.total, valid: validation.valid.length, errors: validation.errors.length })}
          </p>

          {validation.errors.length > 0 ? (
            <DataTable>
              <ol className="divide-y divide-border">
                {validation.errors.map((rowError) => (
                  <li key={rowError.line} className="flex items-start gap-2 bg-background px-4 py-3">
                    <Icon icon={TriangleAlert} size="sm" className="mt-0.5 shrink-0 text-destructive" />
                    <p className="text-body-b7 text-foreground">
                      <span className="text-muted-foreground">{t("lineLabel", { line: rowError.line })}</span>{" "}
                      {rowError.message}
                    </p>
                  </li>
                ))}
              </ol>
            </DataTable>
          ) : null}

          {commitResult ? (
            <div className="flex items-start gap-2 rounded-card-lg border border-border bg-background px-4 py-3">
              <Icon icon={CheckCircle2} size="sm" className="mt-0.5 shrink-0 text-success-foreground" />
              <p className="text-body-b7 text-foreground">
                {t("commitSummary", { created: commitResult.created, updated: commitResult.updated })}
              </p>
            </div>
          ) : null}

          {commitResult && commitResult.errors.length > 0 ? (
            <DataTable>
              <ol className="divide-y divide-border">
                {commitResult.errors.map((rowError) => (
                  <li key={rowError.line} className="flex items-start gap-2 bg-background px-4 py-3">
                    <Icon icon={TriangleAlert} size="sm" className="mt-0.5 shrink-0 text-destructive" />
                    <p className="text-body-b7 text-foreground">
                      <span className="text-muted-foreground">{t("lineLabel", { line: rowError.line })}</span>{" "}
                      {rowError.message}
                    </p>
                  </li>
                ))}
              </ol>
            </DataTable>
          ) : null}

          <div className="flex gap-3">
            {!commitResult && validation.valid.length > 0 ? (
              <Button type="button" size="sm" disabled={busy} loading={phase === "committing"} onClick={commit}>
                {t("commit", { count: validation.valid.length })}
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={reset}>
              {t("startOver")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
