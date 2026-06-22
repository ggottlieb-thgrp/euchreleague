import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg border border-thg-slate/25 bg-thg-surface px-3 text-sm text-thg-slate placeholder:text-thg-slate-light/60 focus:border-thg-slate focus:outline-none focus:ring-2 focus:ring-thg-slate/30 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-lg border border-thg-slate/25 bg-thg-surface px-3 py-2 text-sm text-thg-slate placeholder:text-thg-slate-light/60 focus:border-thg-slate focus:outline-none focus:ring-2 focus:ring-thg-slate/30 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg border border-thg-slate/25 bg-thg-surface px-3 text-sm text-thg-slate focus:border-thg-slate focus:outline-none focus:ring-2 focus:ring-thg-slate/30 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-sans font-semibold text-thg-slate", className)}
      {...props}
    />
  );
}
