import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo, SuitGlyph } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  { title: "Weekly pairings", body: "Auto-generated groups of four, posted every week — opt in and see your partners." },
  { title: "Live standings", body: "Wins and points tracked automatically. Climb the competitive leaderboard." },
  { title: "Find a time & place", body: "Share when you're free and lock in a spot at the office with your group." },
  { title: "Player profiles", body: "Your record, favorite partners, streaks, and season trends in one place." },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="felt-gradient relative overflow-hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
          <Logo onDark showWordmark={false} className="scale-125" />
          <div className="space-y-4">
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.22em] text-thg-yellow">
              The Heritage Group
            </p>
            <h1 className="text-4xl font-extrabold text-white sm:text-6xl">
              THG Euchre League<span className="text-thg-yellow">.</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-thg-mist">
              Season 2 is here. Pairings, scores, standings, and scheduling — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
              Sign in to play
            </Link>
            <Link
              href="/rules"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10",
              )}
            >
              League rules
            </Link>
          </div>
        </div>
        <SuitGlyph className="pointer-events-none absolute -bottom-10 -right-6 h-48 w-48 text-white/5" />
      </section>

      {/* Feature grid */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-thg-slate/10 border-l-4 border-l-thg-yellow bg-thg-surface p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-thg-slate">{f.title}</h2>
              <p className="mt-1.5 text-thg-slate-light">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-thg-slate/10 bg-thg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Logo />
          <p className="text-xs text-thg-slate-light">© The Heritage Group</p>
        </div>
      </footer>
    </main>
  );
}
