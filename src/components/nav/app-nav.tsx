"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MenuDrawer } from "@/components/nav/menu-drawer";

export function AppNav({
  isAdmin,
  name,
}: {
  isAdmin: boolean;
  name: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-thg-slate text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="shrink-0">
          <Logo onDark size="sm" />
        </Link>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 font-sans text-sm font-bold text-thg-mist transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thg-yellow"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="main-menu-drawer"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </div>

      <div id="main-menu-drawer">
        <MenuDrawer open={open} onClose={() => setOpen(false)} isAdmin={isAdmin} name={name} />
      </div>
    </header>
  );
}
