"use client";

import { User, ImagePlus, Images, Camera, Trash2, type LucideIcon } from "lucide-react";
import { Icon, Sheet, SheetTrigger, SheetContent, SheetClose } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

interface PhotoActionProps {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick?: () => void;
}

function PhotoAction({ icon, label, destructive, onClick }: PhotoActionProps) {
  return (
    <SheetClose asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md p-4 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        <Icon icon={icon} size="sm" />
        <span className="text-body-b4">{label}</span>
      </button>
    </SheetClose>
  );
}

/**
 * Profile avatar with a "change photo" affordance that opens a bottom-sheet of
 * actions. The image-picker / camera / remove flows are stubbed until a User
 * entity + upload exist; selecting an action just closes the sheet for now.
 */
export function ProfileAvatarUploader() {
  return (
    <Sheet>
      <div className="relative">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-surface">
          <Icon icon={User} className="size-12 text-icon-muted" />
        </div>

        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Change photo"
            className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors active:bg-primary-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon icon={ImagePlus} size="xs" />
          </button>
        </SheetTrigger>
      </div>

      <SheetContent title="Change profile photo" hideTitle>
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-surface">
            <Icon icon={User} className="size-10 text-icon-muted" />
          </div>
          <p className="text-center text-body-b6 text-foreground">
            Your profile picture will be visible to everyone.
            <br />
            You can change it now.
          </p>
        </div>

        <div aria-hidden className="my-2 h-px w-full bg-border" />

        <div className="flex flex-col">
          <PhotoAction icon={Images} label="Choose From Library" />
          <PhotoAction icon={Camera} label="Take Photo" />
          <PhotoAction icon={Trash2} label="Remove Current Picture" destructive />
        </div>
      </SheetContent>
    </Sheet>
  );
}
