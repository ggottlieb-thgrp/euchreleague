"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setOptIn } from "@/actions/optin";

export function OptInToggle({
  weekId,
  initialOptedIn,
}: {
  weekId: number;
  initialOptedIn: boolean;
}) {
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setOptedIn(next); // optimistic
    startTransition(async () => {
      const res = await setOptIn(weekId, next);
      if (!res.ok) setOptedIn(!next); // revert on failure
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch id="optin" checked={optedIn} onCheckedChange={toggle} disabled={pending} />
      <label htmlFor="optin" className="text-sm font-semibold text-thg-slate">
        {optedIn ? "You're in for this week" : "You're sitting out"}
      </label>
    </div>
  );
}
