"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { COMBOS, type ComboIndex } from "@/lib/euchre";
import { submitGame } from "@/actions/scores";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface GameFormState {
  comboIndex: number | null;
  scoreTeam0: number | null;
  scoreTeam1: number | null;
  submitted: boolean;
}

export function ScoreEntryForm({
  matchupId,
  gameNum,
  seatNames,
  initial,
}: {
  matchupId: number;
  gameNum: number;
  seatNames: string[]; // index = seat
  initial: GameFormState;
}) {
  // Default combo follows the standard rotation (game 1 -> combo 0, etc.)
  const [combo, setCombo] = useState<ComboIndex>(
    (initial.comboIndex ?? gameNum - 1) as ComboIndex,
  );
  const [s0, setS0] = useState(initial.scoreTeam0?.toString() ?? "");
  const [s1, setS1] = useState(initial.scoreTeam1?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initial.submitted);

  const teamName = (team: 0 | 1) => {
    const [a, b] = COMBOS[combo][team];
    return `${seatNames[a]} & ${seatNames[b]}`;
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n0 = parseInt(s0, 10);
    const n1 = parseInt(s1, 10);
    if (Number.isNaN(n0) || Number.isNaN(n1)) {
      setError("Enter both scores.");
      return;
    }
    startTransition(async () => {
      const res = await submitGame({
        matchupId,
        gameNum,
        comboIndex: combo,
        scoreTeam0: n0,
        scoreTeam1: n1,
      });
      if (res.ok) {
        setSaved(true);
        setError(null);
      } else {
        setError(res.error ?? "Couldn't save.");
        setSaved(false);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-lg border p-4",
        saved ? "border-thg-success/40 bg-thg-success/5" : "border-thg-slate/15 bg-thg-surface",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sans font-bold text-thg-slate">Game {gameNum}</h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-thg-success">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-thg-slate-light">
          Record the final score after exactly 8 hands.
        </p>
        <div className="space-y-1">
          <Label htmlFor={`combo-${gameNum}`}>Partners</Label>
          <Select
            id={`combo-${gameNum}`}
            value={combo}
            onChange={(e) => setCombo(parseInt(e.target.value, 10) as ComboIndex)}
          >
            {[0, 1, 2].map((c) => {
              const [t0, t1] = COMBOS[c as ComboIndex];
              return (
                <option key={c} value={c}>
                  {seatNames[t0[0]]} & {seatNames[t0[1]]} vs {seatNames[t1[0]]} & {seatNames[t1[1]]}
                </option>
              );
            })}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`s0-${gameNum}`}>{teamName(0)}</Label>
            <Input
              id={`s0-${gameNum}`}
              type="number"
              min={0}
              max={40}
              inputMode="numeric"
              value={s0}
              onChange={(e) => setS0(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`s1-${gameNum}`}>{teamName(1)}</Label>
            <Input
              id={`s1-${gameNum}`}
              type="number"
              min={0}
              max={40}
              inputMode="numeric"
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {error && <p className="text-sm text-thg-danger">{error}</p>}

        <Button type="submit" variant={saved ? "outline" : "primary"} size="sm" disabled={pending}>
          {pending ? "Saving…" : saved ? "Update score" : "Submit score"}
        </Button>
      </div>
    </form>
  );
}
