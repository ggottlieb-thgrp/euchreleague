"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setUserRole, setUserLeague, removeUser, setUserOptInAdmin } from "@/actions/admin";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function UserRowControls({
  userId,
  role,
  league,
  isSelf,
  openWeekId,
  openWeekNumber,
  optedIn: initialOptedIn,
}: {
  userId: string;
  role: "player" | "admin";
  league: "competitive" | "casual";
  isSelf: boolean;
  openWeekId: number | null;
  openWeekNumber: number | null;
  optedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [optInPending, startOptInTransition] = useTransition();

  function toggleOptIn(next: boolean) {
    if (!openWeekId) return;
    setOptedIn(next); // optimistic
    startOptInTransition(async () => {
      const res = await setUserOptInAdmin(userId, openWeekId, next);
      if (!res.ok) setOptedIn(!next); // revert on failure
    });
  }

  return (
    <div className="flex items-center gap-3">
      {openWeekId ? (
        <div className="flex items-center gap-2" title={`Week ${openWeekNumber} opt-in`}>
          <Switch
            id={`optin-${userId}`}
            checked={optedIn}
            onCheckedChange={toggleOptIn}
            disabled={optInPending}
          />
          <label
            htmlFor={`optin-${userId}`}
            className="whitespace-nowrap text-xs font-semibold text-thg-slate-light"
          >
            {optedIn ? "In" : "Out"} — wk {openWeekNumber}
          </label>
        </div>
      ) : (
        <span className="whitespace-nowrap text-xs text-thg-slate-light">No open week</span>
      )}
      <Select
        defaultValue={league}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            setUserLeague(userId, e.target.value as "competitive" | "casual").then(() => {}),
          )
        }
        className="h-8 w-32"
      >
        <option value="competitive">Competitive</option>
        <option value="casual">Casual</option>
      </Select>
      <Select
        defaultValue={role}
        disabled={pending || isSelf}
        onChange={(e) =>
          startTransition(() =>
            setUserRole(userId, e.target.value as "player" | "admin").then(() => {}),
          )
        }
        className="h-8 w-28"
      >
        <option value="player">Player</option>
        <option value="admin">Admin</option>
      </Select>
      {!isSelf && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this user and all their data?")) {
              startTransition(() => removeUser(userId).then(() => {}));
            }
          }}
          className="text-thg-slate-light hover:text-thg-danger disabled:opacity-50"
          aria-label="Remove user"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
