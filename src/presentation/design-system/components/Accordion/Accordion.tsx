"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Icon } from "../Icon";
import { cn } from "@/src/lib/utils";
import { focusRing } from "../shared/focusRing";

/**
 * Disclosure list built on Radix Accordion. Composable parts:
 *   <Accordion type="single" collapsible>
 *     <AccordionItem value="detail">
 *       <AccordionTrigger>Product detail</AccordionTrigger>
 *       <AccordionContent>…</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Radix owns keyboard interaction and `data-state`; styling keys off it (the
 * chevron rotates on open). `type`/`collapsible` are passed straight through.
 */
export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("rounded-card-lg bg-surface", className)} {...props} />
));

AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-12 w-full items-center justify-between px-4 text-body-b4 text-foreground",
        "transition-colors",
        focusRing,
        "[&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <Icon icon={ChevronDown} size="sm" className="shrink-0 text-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn("overflow-hidden px-4 pb-4 text-body-b6 text-muted-foreground", className)}
    {...props}
  >
    {children}
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = "AccordionContent";
