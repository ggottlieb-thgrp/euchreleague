"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setMatchupPlayers, deleteMatchup } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

const SEAT_LETTERS = ["A", "B", "C", "D"];

export function MatchupEditor({
  matchupId,
  seatUserIds,
  allPlayers,
}: {
  matchupId: number;
  seatUserIds: (string | undefined)[]; // index = seat
  allPlayers: { id: string; name: string }[];
}) {
  const [seats, setSeats] = useState<string[]>(
    [0, 1, 2, 3].map((i) => seatUserIds[i] ?? ""),
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const dirty = seats.some((s, i) => s !== (seatUserIds[i] ?? ""));

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await setMatchupPlayers(matchupId, seats);
      setMsg(res.ok ? "Saved" : res.error ?? "Error");
    });
  }

  return (
    <div className="rounded-lg border border-thg-slate/10 bg-thg-surface p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {seats.map((val, seat) => (
          <label key={seat} className="flex items-center gap-2 text-sm">
            <span className="w-4 font-bold text-thg-slate-light">{SEAT_LETTERS[seat]}</span>
            <Select
              value={val}
              onChange={(e) =>
                setSeats((prev) => prev.map((p, i) => (i === seat ? e.target.value : p)))
              }
              className="h-9"
            >
              <option value="">— empty —</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="primary" disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving…" : "Save players"}
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this matchup?")) {
              startTransition(() => deleteMatchup(matchupId).then(() => {}));
            }
          }}
          className="text-thg-slate-light hover:text-thg-danger disabled:opacity-50"
          aria-label="Delete matchup"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {msg && <span className="text-sm text-thg-slate-light">{msg}</span>}
      </div>
    </div>
  );
}
