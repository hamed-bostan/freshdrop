"use client";

import * as React from "react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { cn } from "@/src/lib/utils";

/**
 * Bottom sheet built on Radix Dialog. Composable parts:
 *   <Sheet> (root, controllable via `open`/`onOpenChange`)
 *     <SheetTrigger>…</SheetTrigger>
 *     <SheetContent title="…">…</SheetContent>
 *   </Sheet>
 *
 * The content slides up from the bottom and is constrained to the app's mobile
 * column (`max-w-md`, centered) so it lines up on larger viewports too.
 */
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  /** Accessible, required dialog title (Radix mandates one). */
  title: string;
  /** Visually hide the title while keeping it for screen readers. */
  hideTitle?: boolean;
  /** Optional screen-reader description of the sheet's purpose. */
  description?: string;
  /** Override the visible title's classes (e.g. start-align for confirmations). */
  titleClassName?: string;
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, title, hideTitle, description, titleClassName, ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-foreground/40",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        )}
      />

      <Dialog.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md",
          "rounded-t-sheet bg-popover px-6 pb-10 pt-3 shadow-lg focus:outline-none",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
          "duration-300",
          className,
        )}
        {...props}
      >
        {/* Drag handle (decorative) */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-pill bg-border" aria-hidden />

        {hideTitle ? (
          <VisuallyHidden.Root asChild>
            <Dialog.Title>{title}</Dialog.Title>
          </VisuallyHidden.Root>
        ) : (
          <Dialog.Title className={cn("mb-6 text-center text-heading-h4 text-foreground", titleClassName)}>
            {title}
          </Dialog.Title>
        )}

        {description && <Dialog.Description className="sr-only">{description}</Dialog.Description>}

        {children}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);

SheetContent.displayName = "SheetContent";
