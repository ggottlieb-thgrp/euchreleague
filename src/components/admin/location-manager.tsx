"use client";

import { useState, useTransition } from "react";
import { createLocation, toggleLocation } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function LocationForm() {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLocation({ name, building, floor });
      if (res.ok) {
        setName("");
        setBuilding("");
        setFloor("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1 sm:col-span-3">
        <Label htmlFor="loc-name">Name</Label>
        <Input
          id="loc-name"
          placeholder="3rd Floor Break Area"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="loc-building">Building</Label>
        <Input id="loc-building" value={building} onChange={(e) => setBuilding(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="loc-floor">Floor</Label>
        <Input id="loc-floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="accent" className="w-full" disabled={pending}>
          {pending ? "Adding…" : "Add location"}
        </Button>
      </div>
    </form>
  );
}

export function LocationToggle({ id, active }: { id: number; active: boolean }) {
  const [on, setOn] = useState(active);
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={on}
      disabled={pending}
      onCheckedChange={(next) => {
        setOn(next);
        startTransition(async () => {
          const res = await toggleLocation(id, next);
          if (!res.ok) setOn(!next);
        });
      }}
    />
  );
}
