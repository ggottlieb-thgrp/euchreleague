"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { Check } from "lucide-react";
import { saveRecurringAvailability } from "@/actions/availability";
import {
  SLOTS_PER_DAY,
  WEEKDAYS,
  WEEKDAY_LABELS,
  slotStartLabel,
} from "@/lib/time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function key(weekday: number, slot: number) {
  return `${weekday}-${slot}`;
}

export function AvailabilityGrid({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Drag state: paint or erase based on the first cell touched.
  const dragging = useRef(false);
  const paintMode = useRef<boolean>(true);

  const apply = useCallback((k: string, paint: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (paint) next.add(k);
      else next.delete(k);
      return next;
    });
    setSaved(false);
  }, []);

  const onCellDown = (k: string) => {
    dragging.current = true;
    paintMode.current = !selected.has(k);
    apply(k, paintMode.current);
  };
  const onCellEnter = (k: string) => {
    if (dragging.current) apply(k, paintMode.current);
  };

  function save() {
    const slots = [...selected].map((s) => {
      const [weekday, slotIndex] = s.split("-").map(Number);
      return { weekday, slotIndex };
    });
    startTransition(async () => {
      const res = await saveRecurringAvailability(slots);
      if (res.ok) setSaved(true);
    });
  }

  // Only label every other slot (top of the hour) to reduce clutter.
  const slotIndexes = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i);

  return (
    <div
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      className="select-none"
    >
      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `auto repeat(${WEEKDAYS.length}, minmax(56px, 1fr))` }}>
          {/* Header row */}
          <div />
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-1 pb-1 text-center text-xs font-sans font-bold text-thg-slate">
              {WEEKDAY_LABELS[d]}
            </div>
          ))}

          {/* Slot rows */}
          {slotIndexes.map((slot) => (
            <Row
              key={slot}
              slot={slot}
              selected={selected}
              onCellDown={onCellDown}
              onCellEnter={onCellEnter}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save availability"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-thg-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <span className="text-sm text-thg-slate-light">
          {selected.size} slot{selected.size === 1 ? "" : "s"} selected
        </span>
      </div>
      <p className="mt-2 text-xs text-thg-slate-light">
        Click or drag to mark when you&apos;re typically free. Click a selected cell to clear it.
      </p>
    </div>
  );
}

function Row({
  slot,
  selected,
  onCellDown,
  onCellEnter,
}: {
  slot: number;
  selected: Set<string>;
  onCellDown: (k: string) => void;
  onCellEnter: (k: string) => void;
}) {
  const onHour = slot % 2 === 0;
  return (
    <>
      <div className={cn("pr-2 text-right text-[10px] leading-5 text-thg-slate-light", !onHour && "opacity-0")}>
        {onHour ? slotStartLabel(slot) : ""}
      </div>
      {WEEKDAYS.map((d) => {
        const k = key(d, slot);
        const on = selected.has(k);
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onMouseDown={(e) => {
              e.preventDefault();
              onCellDown(k);
            }}
            onMouseEnter={() => onCellEnter(k)}
            className={cn(
              "h-5 border border-thg-slate/10 transition-colors",
              onHour && "border-t-thg-slate/25",
              on ? "bg-thg-yellow hover:bg-thg-yellow-light" : "bg-thg-mist-light/40 hover:bg-thg-mist",
            )}
          />
        );
      })}
    </>
  );
}
