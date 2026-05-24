import { cn } from "@/src/lib/utils";

interface FloatingLabelProps {
  id: string;
  label: string;
  required?: boolean;
  floatingOffset: string;
  floating: boolean;
  focused: boolean;
}

export function FloatingLabel({ id, label, required, floatingOffset, floating, focused }: FloatingLabelProps) {
  const floatingClasses = floating ? "top-0 -translate-y-1/2 text-foreground" : "top-1/2 -translate-y-1/2";

  const beforeHeight = floating && focused ? "before:h-1.5" : "before:h-0";

  return (
    <label
      htmlFor={id}
      className={cn(
        "pointer-events-none absolute z-10 origin-left text-muted-foreground transition-all duration-200",
        "before:absolute before:left-0 before:right-0 before:top-1/2 before:-translate-y-1/2 before:bg-input before:content-['']",
        floatingClasses,
        beforeHeight,
        floatingOffset,
      )}
    >
      <span className="relative z-10 px-1">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
    </label>
  );
}
