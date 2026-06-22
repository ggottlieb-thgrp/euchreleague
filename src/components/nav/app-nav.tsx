"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "./sign-out-button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pairings", label: "Pairings" },
  { href: "/scores", label: "Scores" },
  { href: "/availability", label: "Schedule" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/history", label: "History" },
  { href: "/announcements", label: "News" },
  { href: "/players", label: "Players" },
  { href: "/rules", label: "Rules" },
];

export function AppNav({
  isAdmin,
  name,
}: {
  isAdmin: boolean;
  name: string | null | undefined;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-thg-slate/10 bg-thg-slate text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="shrink-0">
          <Logo onDark />
        </Link>

        {/* Desktop links */}
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-sans font-semibold transition-colors whitespace-nowrap",
                isActive(l.href)
                  ? "bg-thg-yellow text-thg-slate"
                  : "text-thg-mist hover:bg-white/10 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {name && <span className="text-sm text-thg-mist">{name.split(" ")[0]}</span>}
          <Link
            href="/settings/notifications"
            className="rounded-md px-2.5 py-1.5 text-sm font-sans font-semibold text-thg-mist hover:bg-white/10 hover:text-white"
          >
            Settings
          </Link>
          <SignOutButton className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-sans font-semibold text-thg-mist hover:bg-white/10 hover:text-white" />
        </div>

        <button
          type="button"
          className="rounded-md p-2 hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-sans font-semibold",
                  isActive(l.href)
                    ? "bg-thg-yellow text-thg-slate"
                    : "text-thg-mist hover:bg-white/10",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-sans font-semibold text-thg-mist hover:bg-white/10"
            >
              Settings
            </Link>
          </div>
          <SignOutButton className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-sans font-semibold text-white" />
        </nav>
      )}
    </header>
  );
}
