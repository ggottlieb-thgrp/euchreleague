"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { setMatchupPlayers, deleteMatchup } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

const SEAT_LETTERS = ["A", "B", "C", "D"];

function useSaveSeats(matchupId: number) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  function save(seats: string[]) {
    setMsg(null);
    startTransition(async () => {
      const res = await setMatchupPlayers(matchupId, seats);
      setMsg(res.ok ? "Saved" : res.error ?? "Error");
    });
  }
  return { pending, msg, save, startTransition };
}

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
  const { pending, msg, save, startTransition } = useSaveSeats(matchupId);

  const dirty = seats.some((s, i) => s !== (seatUserIds[i] ?? ""));

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
        <Button size="sm" variant="primary" disabled={!dirty || pending} onClick={() => save(seats)}>
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

/**
 * Bye group editor: unlike a real matchup, a bye group can hold any number
 * of players, so this renders a variable-length list instead of four fixed
 * seats. Assigning a bye player to a real matchup (via `MatchupEditor`
 * above) is the normal way to bring them back in — this editor is mainly
 * for reviewing who's out and, if needed, dropping someone from the week
 * entirely.
 */
export function ByeGroupEditor({
  matchupId,
  seatUserIds,
  allPlayers,
}: {
  matchupId: number;
  seatUserIds: (string | undefined)[];
  allPlayers: { id: string; name: string }[];
}) {
  const initialIds = seatUserIds.filter((id): id is string => !!id);
  const [rows, setRows] = useState<string[]>([...initialIds, ""]);
  const { pending, msg, save } = useSaveSeats(matchupId);

  const current = rows.filter((r) => r !== "");
  const dirty =
    current.length !== initialIds.length || current.some((id) => !initialIds.includes(id));

  function setRow(index: number, value: string) {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === index ? value : r));
      const trimmed = next.filter((r) => r !== "");
      return [...trimmed, ""];
    });
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-lg border border-thg-slate/10 bg-thg-surface p-4">
      <div className="space-y-2">
        {rows.map((val, i) => {
          const isAddRow = i === rows.length - 1;
          const options = allPlayers.filter((p) => p.id === val || !current.includes(p.id));
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Select value={val} onChange={(e) => setRow(i, e.target.value)} className="h-9 flex-1">
                <option value="">{isAddRow ? "— add player to bye —" : "— remove —"}</option>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {!isAddRow && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-thg-slate-light hover:text-thg-danger"
                  aria-label="Remove from bye"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="primary" disabled={!dirty || pending} onClick={() => save(current)}>
          {pending ? "Saving…" : "Save bye group"}
        </Button>
        {msg && <span className="text-sm text-thg-slate-light">{msg}</span>}
      </div>
    </div>
  );
}
