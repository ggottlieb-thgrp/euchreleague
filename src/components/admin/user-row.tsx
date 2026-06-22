"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setUserRole, setUserLeague, removeUser } from "@/actions/admin";
import { Select } from "@/components/ui/input";

export function UserRowControls({
  userId,
  role,
  league,
  isSelf,
}: {
  userId: string;
  role: "player" | "admin";
  league: "competitive" | "casual";
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
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
