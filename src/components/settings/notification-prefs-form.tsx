"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setNotificationPrefs, type PrefsInput } from "@/actions/notifications";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const ROWS: { key: keyof PrefsInput; label: string; desc: string }[] = [
  { key: "pairings", label: "Weekly pairings", desc: "When new pairings are posted." },
  { key: "schedule", label: "Scheduling", desc: "When a game time is proposed or confirmed." },
  { key: "scoreReminders", label: "Score reminders", desc: "A nudge when scores are due." },
  { key: "gameReminders", label: "Game reminders", desc: "Before an upcoming scheduled game." },
];

export function NotificationPrefsForm({ initial }: { initial: PrefsInput }) {
  const [prefs, setPrefs] = useState<PrefsInput>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await setNotificationPrefs(prefs);
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-thg-slate/10">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-semibold text-thg-slate">{r.label}</p>
              <p className="text-sm text-thg-slate-light">{r.desc}</p>
            </div>
            <Switch
              checked={prefs[r.key]}
              onCheckedChange={(v) => {
                setPrefs((p) => ({ ...p, [r.key]: v }));
                setSaved(false);
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-thg-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
