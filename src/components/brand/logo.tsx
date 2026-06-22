import { cn } from "@/lib/utils";

/**
 * Brand mark for the league. Avoids touching the official THG logo (brand rules
 * forbid altering it); instead pairs a euchre suit motif with a slate/yellow
 * tile in the THG palette. `onDark` flips text to white for slate backgrounds.
 */
export function Logo({
  className,
  onDark = false,
  showWordmark = true,
}: {
  className?: string;
  onDark?: boolean;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-thg-slate shadow-sm">
        <SuitGlyph className="h-5 w-5 text-thg-yellow" />
      </span>
      {showWordmark && (
        <span className="leading-none">
          <span
            className={cn(
              "block font-sans text-base font-extrabold tracking-tight",
              onDark ? "text-white" : "text-thg-slate",
            )}
          >
            Euchre League
          </span>
          <span
            className={cn(
              "block font-sans text-[10px] font-semibold uppercase tracking-[0.18em]",
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
