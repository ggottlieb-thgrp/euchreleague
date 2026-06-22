"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setMyLeague } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";

type League = "competitive" | "casual";

export function LeaguePreferenceForm({ initialLeague }: { initialLeague: League }) {
  const [league, setLeague] = useState<League>(initialLeague);
  const [savedLeague, setSavedLeague] = useState<League>(initialLeague);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await setMyLeague(league);
      if (res.ok) {
        setSavedLeague(league);
        setMessage({ text: "Saved", ok: true });
      } else {
        setMessage({ text: res.error ?? "Unable to save", ok: false });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="league">League</Label>
        <Select
          id="league"
          value={league}
          onChange={(event) => {
            setLeague(event.target.value as League);
            setMessage(null);
          }}
        >
          <option value="competitive">Competitive</option>
          <option value="casual">Casual</option>
        </Select>
        <p className="text-sm text-thg-slate-light">
          This controls which league you opt into and where your pairings show up.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} variant="accent" disabled={pending || league === savedLeague}>
          {pending ? "Saving…" : "Save league"}
        </Button>
        {message && (
          <span
            className={
              message.ok
                ? "flex items-center gap-1 text-sm font-semibold text-thg-success"
                : "text-sm font-semibold text-thg-danger"
            }
          >
            {message.ok && <Check className="h-4 w-4" />}
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
