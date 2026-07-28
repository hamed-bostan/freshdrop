"use client";

import { Check } from "lucide-react";
import { Icon, Sheet, SheetContent, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
}

/** A bottom sheet listing single-select options, a check mark on the current one. */
export function PickerSheet({ open, onOpenChange, title, options, value, onChange }: PickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title}>
        <div className="flex flex-col gap-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={cn(
                "flex items-center justify-between rounded-card-lg p-3 text-body-b3 text-foreground transition-colors hover:bg-muted",
                focusRing,
              )}
            >
              {option.label}
              {option.value === value && <Icon icon={Check} size="sm" className="text-primary" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
