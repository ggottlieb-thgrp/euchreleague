"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  History,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Play",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pairings", label: "Pairings", icon: UsersRound },
      { href: "/scores", label: "Scores", icon: ClipboardList },
      { href: "/availability", label: "Schedule", icon: CalendarClock },
    ],
  },
  {
    label: "League",
    links: [
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/history", label: "History", icon: History },
      { href: "/players", label: "Players", icon: UsersRound },
      { href: "/announcements", label: "News", icon: Megaphone },
      { href: "/rules", label: "Rules", icon: ScrollText },
    ],
  },
  {
    label: "Account",
    links: [{ href: "/settings/notifications", label: "Settings", icon: Settings }],
  },
] as const;

export function MenuDrawer({
  open,
  onClose,
  isAdmin,
  name,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  name: string | null | undefined;
}) {
  const pathname = usePathname();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const groups = isAdmin
    ? [
        ...GROUPS,
        {
          label: "Admin",
          links: [{ href: "/admin", label: "Commissioner tools", icon: Shield }],
        },
      ]
    : GROUPS;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-[visibility] duration-200",
        open ? "visible" : "invisible",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "absolute inset-0 bg-thg-slate/55 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[25rem] flex-col bg-thg-surface shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-b border-thg-slate/10 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Logo size="sm" />
              {name && (
                <p className="mt-3 font-sans text-sm font-semibold text-thg-slate-light">
                  Signed in as {name.split(" ")[0]}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="rounded-md p-2 text-thg-slate transition-colors hover:bg-thg-mist-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thg-slate"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 id={titleId} className="sr-only">
            Main navigation
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.18em] text-thg-slate-light">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thg-slate",
                          active
                            ? "bg-thg-yellow text-thg-slate"
                            : "text-thg-slate hover:bg-thg-mist-light",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-thg-slate/10 p-5">
          <SignOutButton className="flex w-full items-center justify-center gap-2 rounded-md bg-thg-slate px-4 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-thg-slate-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thg-slate focus-visible:ring-offset-2" />
        </div>
      </aside>
    </div>
  );
}
