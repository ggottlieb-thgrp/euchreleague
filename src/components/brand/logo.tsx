import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand mark for the league. Uses the supplied THG mark at real dimensions so
 * it stays crisp, then pairs it with the league wordmark.
 */
export function Logo({
  className,
  onDark = false,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  onDark?: boolean;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: {
      tile: "h-11 w-11",
      image: 34,
      title: "text-sm",
      subtitle: "text-[9px]",
    },
    md: {
      tile: "h-13 w-13",
      image: 42,
      title: "text-base",
      subtitle: "text-[10px]",
    },
    lg: {
      tile: "h-24 w-24",
      image: 82,
      title: "text-3xl",
      subtitle: "text-xs",
    },
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-thg-slate shadow-sm ring-1",
          sizes.tile,
          onDark ? "ring-white/15" : "ring-thg-slate/10",
        )}
      >
        <Image
          src="/thg-mark.png"
          alt="The Heritage Group"
          width={sizes.image}
          height={sizes.image}
          className="h-auto w-auto"
          priority={size === "lg"}
        />
      </span>
      {showWordmark && (
        <span className="leading-none">
          <span
            className={cn(
              "block font-sans font-extrabold tracking-normal",
              sizes.title,
              onDark ? "text-white" : "text-thg-slate",
            )}
          >
            Euchre League
          </span>
          <span
            className={cn(
              "mt-1 block font-sans font-semibold uppercase tracking-[0.18em]",
              sizes.subtitle,
              onDark ? "text-thg-yellow" : "text-thg-slate-light",
            )}
          >
            The Heritage Group
          </span>
        </span>
      )}
    </span>
  );
}

/** A clubs suit, the euchre nod, drawn in currentColor. */
export function SuitGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.6a3.4 3.4 0 0 0-2.55 5.64A3.4 3.4 0 1 0 8.7 14.2c.86 0 1.65-.32 2.25-.85-.18 1.7-.86 3.4-2.2 4.95h6.5c-1.34-1.55-2.02-3.25-2.2-4.95.6.53 1.39.85 2.25.85a3.4 3.4 0 1 0-.75-5.96A3.4 3.4 0 0 0 12 2.6Z" />
    </svg>
  );
}
