"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "@/actions/admin";

export function DeleteAnnouncementButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this announcement?")) {
          startTransition(async () => {
            await deleteAnnouncement(id);
          });
        }
      }}
      className="text-thg-slate-light hover:text-thg-danger disabled:opacity-50"
      aria-label="Delete announcement"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
