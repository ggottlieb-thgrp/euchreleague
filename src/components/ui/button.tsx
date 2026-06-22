import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Variants encode the THG contrast rules so they can't be misused:
// - primary: slate surface, white text (white-on-slate is allowed)
// - accent:  yellow surface, slate text (never white-on-yellow)
// - outline/ghost: slate text on light surfaces
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-sans font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thg-slate focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-thg-slate text-white hover:bg-thg-slate-light shadow-sm",
        accent: "bg-thg-yellow text-thg-slate hover:bg-thg-yellow-light shadow-sm",
        outline:
          "border border-thg-slate/30 bg-thg-surface text-thg-slate hover:border-thg-slate hover:bg-thg-mist-light",
        ghost: "text-thg-slate hover:bg-thg-mist-light",
        danger: "bg-thg-danger text-white hover:bg-thg-danger/90 shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
