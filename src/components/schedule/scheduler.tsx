"use client";

import { useState, useTransition } from "react";
import { Check, MapPin, Users, AlertTriangle } from "lucide-react";
import { proposeSchedule, confirmSchedule } from "@/actions/schedule";
import {
  WEEKDAY_LABELS,
  slotStartLabel,
  scheduleFormatter,
} from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface WindowDTO {
  weekday: number;
  startSlot: number;
  endSlot: number;
  allFree: boolean;
  missingNames: string[];
}

export interface CurrentSchedule {
  status: "unscheduled" | "proposed" | "confirmed";
  startsAt: string | null; // ISO
  locationName: string | null;
}

export function Scheduler({
  matchupId,
  windows,
  degraded,
  locations,
  current,
}: {
  matchupId: number;
  windows: WindowDTO[];
  degraded: boolean;
  locations: { id: number; name: string }[];
  current: CurrentSchedule;
}) {
  const [picked, setPicked] = useState<number>(0);
  const [locationId, setLocationId] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function propose() {
    const w = windows[picked];
    if (!w) return;
    setMsg(null);
    startTransition(async () => {
      const res = await proposeSchedule({
        matchupId,
        weekday: w.weekday,
        startSlot: w.startSlot,
        slotSpan: Math.min(3, w.endSlot - w.startSlot),
        locationId: locationId ? parseInt(locationId, 10) : null,
      });
      setMsg(res.ok ? "Proposed! Your group has been notified." : res.error ?? "Error");
    });
  }

  function confirm() {
    setMsg(null);
    startTransition(async () => {
      const res = await confirmSchedule(matchupId);
      setMsg(res.ok ? "Confirmed!" : res.error ?? "Error");
    });
  }

  return (
    <div className="space-y-5">
      {current.status !== "unscheduled" && (
        <div
          className={cn(
            "rounded-lg border p-4",
            current.status === "confirmed"
              ? "border-thg-success/40 bg-thg-success/5"
              : "border-thg-yellow/50 bg-thg-yellow-light/20",
          )}
        >
          <div className="flex items-center gap-2 font-semibold text-thg-slate">
            {current.status === "confirmed" ? (
              <Check className="h-4 w-4 text-thg-success" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {current.status === "confirmed" ? "Confirmed" : "Proposed"}
          </div>
          <p className="mt-1 text-sm text-thg-slate">
            {current.startsAt ? scheduleFormatter.format(new Date(current.startsAt)) : "Time TBD"}
            {current.locationName ? ` · ${current.locationName}` : ""}
          </p>
          {current.status === "proposed" && (
            <Button size="sm" variant="accent" className="mt-3" onClick={confirm} disabled={pending}>
              Confirm this time
            </Button>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-2 font-sans font-bold text-thg-slate">Suggested times</h3>
        {windows.length === 0 ? (
          <p className="text-sm text-thg-slate-light">
            No overlapping availability yet. Ask your group to fill in their availability.
          </p>
        ) : (
          <>
            {degraded && (
              <p className="mb-2 flex items-center gap-1.5 text-sm text-thg-slate-light">
                <AlertTriangle className="h-4 w-4 text-thg-yellow" />
                No time works for all four — showing the best options where one is out.
              </p>
            )}
            <div className="space-y-2">
              {windows.map((w, i) => (
                <button
                  key={`${w.weekday}-${w.startSlot}`}
                  type="button"
                  onClick={() => setPicked(i)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-colors",
                    picked === i
                      ? "border-thg-slate bg-thg-mist-light"
                      : "border-thg-slate/15 hover:bg-thg-mist-light/50",
                  )}
                >
                  <span className="font-semibold text-thg-slate">
                    {WEEKDAY_LABELS[w.weekday]} · {slotStartLabel(w.startSlot)} – {slotStartLabel(w.endSlot)}
                  </span>
                  {w.allFree ? (
                    <span className="text-xs font-semibold text-thg-success">All 4 free</span>
                  ) : (
                    <span className="text-xs text-thg-slate-light">
                      {w.missingNames.join(", ")} out
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="loc">
          <MapPin className="mr-1 inline h-4 w-4" />
          Location
        </Label>
        <Select id="loc" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Pick a spot (optional)</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={propose} disabled={pending || windows.length === 0} variant="primary">
          {pending ? "Saving…" : current.status === "unscheduled" ? "Propose time" : "Update proposal"}
        </Button>
        {msg && <span className="text-sm text-thg-slate-light">{msg}</span>}
      </div>
    </div>
  );
}
