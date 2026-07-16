"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

interface IconUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** A11y wiring forwarded from the surrounding <Field>. */
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

/**
 * Category icon picker: uploads the chosen file to `/api/images/upload`
 * (Supabase, folder `categories`) and lifts the resulting public URL via
 * `onChange`, showing a live preview and any upload error.
 */
export function IconUpload({ value, onChange, id, ...aria }: IconUploadProps) {
  const t = useTranslations("dashCategories");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-selected after an error
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "categories");

      const res = await fetch("/api/images/upload", { method: "POST", body });
      const json: { image?: { url: string }; error?: string } = await res.json();
      if (!res.ok || !json.image) throw new Error(json.error ?? t("uploadFailed"));

      onChange(json.image.url);
    } catch (err) {
      // The route's error strings are developer-facing (bad form shape, unknown
      // folder) — log them for debugging, show the localized copy to the admin.
      console.error("Image upload failed:", err);
      setError(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card-lg bg-surface-sunken">
        {value ? (
          <Image src={value} alt={t("iconPreviewAlt")} width={64} height={64} className="object-contain" />
        ) : (
          <Icon icon={ImagePlus} size="md" className="text-icon-muted" />
        )}
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={handleFile}
          {...aria}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Icon icon={Loader2} size="sm" className="me-2 animate-spin" />
              {t("uploading")}
            </>
          ) : value ? (
            t("replaceImage")
          ) : (
            t("uploadImage")
          )}
        </Button>
        {error ? (
          <p className="text-body-b10 text-destructive">{error}</p>
        ) : (
          <p className="text-body-b10 text-muted-foreground">{t("uploadHint")}</p>
        )}
      </div>
    </div>
  );
}
