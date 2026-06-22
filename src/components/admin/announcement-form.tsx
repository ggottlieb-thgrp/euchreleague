"use client";

import { useState, useTransition } from "react";
import { createAnnouncement } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

export function AnnouncementForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createAnnouncement({ title, body });
      if (res.ok) {
        setTitle("");
        setBody("");
      } else {
        setError(res.error ?? "Couldn't post.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-thg-danger">{error}</p>}
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Posting…" : "Post announcement"}
      </Button>
    </form>
  );
}
