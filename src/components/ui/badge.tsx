import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-sans font-semibold",
  {
    variants: {
      variant: {
        slate: "bg-thg-slate text-white",
        yellow: "bg-thg-yellow text-thg-slate",
        soft: "bg-thg-mist text-thg-slate",
        outline: "border border-thg-slate/30 text-thg-slate",
        success: "bg-thg-success/15 text-thg-success",
        danger: "bg-thg-danger/15 text-thg-danger",
      },
    },
    defaultVariants: { variant: "soft" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
