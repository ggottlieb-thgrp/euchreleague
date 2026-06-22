"use client";

import { useState, useTransition } from "react";
import {
  createSeason,
  createNextWeek,
  generatePairingsAction,
  publishWeekAction,
  unpublishWeekAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function CreateSeasonForm({ league }: { league: "competitive" | "casual" }) {
  const [name, setName] = useState("");
  const [numWeeks, setNumWeeks] = useState("4");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() =>
          createSeason({ name, league, numWeeks: parseInt(numWeeks, 10) || 4 }).then(() => {}),
        );
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
    >
      <div className="space-y-1">
        <Label htmlFor={`season-${league}`}>Season name</Label>
        <Input
          id={`season-${league}`}
          placeholder="Season 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`weeks-${league}`}>Weeks</Label>
        <Input
          id={`weeks-${league}`}
          type="number"
          min={1}
          max={20}
          value={numWeeks}
          onChange={(e) => setNumWeeks(e.target.value)}
          className="w-20"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Creating…" : "Start season"}
        </Button>
      </div>
    </form>
  );
}

export function CreateNextWeekButton({ seasonId }: { seasonId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => createNextWeek(seasonId).then(() => {}))}
    >
      {pending ? "Adding…" : "+ Add next week"}
    </Button>
  );
}

export function WeekActions({
  weekId,
  status,
}: {
  weekId: number;
  status: "pending" | "preview" | "published" | "completed";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(status === "pending" || status === "preview") && (
        <Button
          size="sm"
          variant="primary"
          disabled={pending}
          onClick={() => run(() => generatePairingsAction(weekId))}
        >
          {status === "preview" ? "Regenerate" : "Generate pairings"}
        </Button>
      )}
      {status === "preview" && (
        <Button
          size="sm"
          variant="accent"
          disabled={pending}
          onClick={() => run(() => publishWeekAction(weekId))}
        >
          Publish &amp; notify
        </Button>
      )}
      {status === "published" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => unpublishWeekAction(weekId))}
        >
          Unpublish
        </Button>
      )}
      {error && <span className="text-sm text-thg-danger">{error}</span>}
    </div>
  );
}
