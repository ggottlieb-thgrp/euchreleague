import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Trophy,
  UsersRound,
} from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: UsersRound,
    title: "Weekly pairings",
    body: "Auto-generated groups of four, posted every week after opt-ins close.",
  },
  {
    icon: Trophy,
    title: "Live standings",
    body: "Wins, points, averages, streaks, and player profiles stay current.",
  },
  {
    icon: CalendarClock,
    title: "Find a time and place",
    body: "Share availability, pick an office location, and send a calendar invite.",
  },
  {
    icon: ClipboardList,
    title: "Simple score entry",
    body: "Record the three-game rotation and keep history clean for the season.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col bg-thg-mist-light">
      <section className="felt-gradient relative overflow-hidden">
        <div className="mx-auto flex min-h-[min(760px,92vh)] max-w-6xl flex-col px-6 py-6">
          <header className="flex items-center justify-between">
            <Logo onDark size="sm" />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10",
              )}
            >
              Sign in
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_360px] lg:py-20">
            <div className="max-w-3xl">
              <h1 className="font-sans text-5xl font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                THG Euchre League
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-thg-mist">
                A company-wide league for meeting new people, having fun, and a
                little friendly competition across The Heritage Group.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "accent", size: "lg" }),
                  )}
                >
                  Sign in to play
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/rules"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10",
                  )}
                >
                  League rules
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="border-l-4 border-l-thg-yellow bg-white/8 p-8 shadow-2xl ring-1 ring-white/15 backdrop-blur">
                <Logo onDark size="lg" className="items-start" />
                <div className="mt-10 space-y-5 font-sans text-sm font-bold uppercase tracking-[0.18em] text-thg-mist">
                  <p>Weekly opt-in</p>
                  <p>Random pairings</p>
                  <p>All skill levels welcome</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/15 pt-5 text-sm text-thg-mist sm:grid-cols-3">
            <p className="font-sans font-bold text-thg-yellow">Season 2</p>
            <p>Competitive and casual leagues</p>
            <p className="sm:text-right">Built for in-office play</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <h2 className="font-sans text-3xl font-extrabold text-thg-slate">
            Everything the league needs, in one place.
          </h2>
          <p className="mt-4 text-lg leading-7 text-thg-slate-light">
            The app keeps the weekly cycle moving without spreadsheet handoffs
            or long email threads.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-thg-slate/10 border-l-4 border-l-thg-yellow bg-thg-surface p-6 shadow-sm"
            >
              <f.icon className="mb-4 h-5 w-5 text-thg-slate" />
              <h2 className="text-lg font-bold text-thg-slate">{f.title}</h2>
              <p className="mt-2 leading-6 text-thg-slate-light">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-thg-slate/10 bg-thg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <Logo size="sm" />
          <p className="text-xs text-thg-slate-light">© The Heritage Group</p>
        </div>
      </footer>
    </main>
  );
}
