"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { User, ImagePlus, Images, Camera, Trash2, type LucideIcon } from "lucide-react";
import { Avatar, focusRing, FormMessage, Icon, Sheet, SheetClose, SheetContent, SheetTrigger, Spinner } from "@/src/presentation/design-system";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { cn } from "@/src/lib/utils";
import { profilesApi } from "../profile-api";

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

interface PhotoActionProps {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function PhotoAction({ icon, label, destructive, disabled, onClick }: PhotoActionProps) {
  return (
    <SheetClose asChild>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 rounded-card-md p-4 transition-colors",
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        <Icon icon={icon} size="sm" />
        <span className="text-body-b4">{label}</span>
      </button>
    </SheetClose>
  );
}

interface ProfileAvatarUploaderProps {
  /** Current avatar URL, or `null` when none is set. */
  value: string | null;
  /** Called with the new URL after an upload, or `null` when the picture is removed. */
  onChange: (url: string | null) => void;
}

/**
 * Profile avatar with a "change photo" bottom sheet. Picking an image uploads it
 * to the `avatars` bucket folder and lifts the resulting public URL via
 * `onChange`; the surrounding form persists it on save. "Take Photo" opens the
 * camera on devices that support capture, falling back to the file picker.
 */
export function ProfileAvatarUploader({ value, onChange }: ProfileAvatarUploaderProps) {
  const t = useTranslations("profile");
  const tApiErrors = useTranslations("apiErrors");
  const libraryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-selected after an error
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const url = await profilesApi.uploadAvatar(file);
      onChange(url);
    } catch (err) {
      setError(localizeApiError(err, tApiErrors, t("uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input ref={libraryInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleFile} />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={handleFile}
      />

      <Sheet>
        <div className="relative">
          <Avatar
            tone="surface"
            className="size-24"
            fallback={<Icon icon={User} className="size-12 text-icon-muted" />}
          >
            {uploading ? (
              <Spinner size="xl" className="text-icon-muted" />
            ) : (
              value && <Image src={value} alt={t("avatarAlt")} width={96} height={96} className="size-full object-cover" />
            )}
          </Avatar>

          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("changePhoto")}
              disabled={uploading}
              className={cn(
                "absolute bottom-0 end-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors active:bg-primary-pressed disabled:opacity-50",
                focusRing,
              )}
            >
              <Icon icon={ImagePlus} size="xs" />
            </button>
          </SheetTrigger>
        </div>

        <SheetContent title={t("changePhotoTitle")} hideTitle>
          <div className="flex flex-col items-center gap-3">
            <Avatar
              tone="surface"
              className="size-20"
              fallback={<Icon icon={User} className="size-10 text-icon-muted" />}
            >
              {value && <Image src={value} alt={t("avatarAlt")} width={80} height={80} className="size-full object-cover" />}
            </Avatar>
            <p className="text-center text-body-b6 text-foreground">
              {t.rich("photoNotice", { br: () => <br /> })}
            </p>
          </div>

          <div aria-hidden className="my-2 h-px w-full bg-border" />

          <div className="flex flex-col">
            <PhotoAction
              icon={Images}
              label={t("chooseFromLibrary")}
              onClick={() => libraryInputRef.current?.click()}
            />
            <PhotoAction icon={Camera} label={t("takePhoto")} onClick={() => cameraInputRef.current?.click()} />
            <PhotoAction
              icon={Trash2}
              label={t("removePicture")}
              destructive
              disabled={!value}
              onClick={() => onChange(null)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {error ? <FormMessage>{error}</FormMessage> : null}
    </div>
  );
}
