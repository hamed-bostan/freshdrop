"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { imagesApi } from "@/src/presentation/images/image-api";

interface ProductImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** A11y wiring forwarded from the surrounding <Field>. */
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

/**
 * Product image picker: uploads the chosen file to `/api/images/upload`
 * (Supabase, folder `products`) and lifts the resulting public URL via
 * `onChange`, showing a live preview and any upload error. Mirrors the
 * category `IconUpload`.
 */
export function ProductImageUpload({ value, onChange, id, ...aria }: ProductImageUploadProps) {
  const t = useTranslations("dashProducts");
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
      onChange(await imagesApi.upload(file, "products"));
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
          <Image src={value} alt={t("imagePreviewAlt")} width={80} height={80} className="size-full object-cover" />
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
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("uploading") : value ? t("replaceImage") : t("uploadImage")}
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
