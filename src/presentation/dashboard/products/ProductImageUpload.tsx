"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

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
      body.append("folder", "products");

      const res = await fetch("/api/images/upload", { method: "POST", body });
      const json: { image?: { url: string }; error?: string } = await res.json();
      if (!res.ok || !json.image) throw new Error(json.error ?? "Upload failed.");

      onChange(json.image.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card-lg bg-surface-sunken">
        {value ? (
          <Image src={value} alt="Product image preview" width={80} height={80} className="size-full object-cover" />
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
              <Icon icon={Loader2} size="sm" className="mr-2 animate-spin" />
              Uploading…
            </>
          ) : value ? (
            "Replace image"
          ) : (
            "Upload image"
          )}
        </Button>
        {error ? (
          <p className="text-body-b10 text-destructive">{error}</p>
        ) : (
          <p className="text-body-b10 text-muted-foreground">PNG, JPG, WebP or AVIF · up to 5 MB</p>
        )}
      </div>
    </div>
  );
}
