import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="felt-gradient flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <Logo onDark showWordmark={false} className="scale-125" />
      <div>
        <h1 className="text-4xl font-extrabold text-white">Renege!</h1>
        <p className="mt-2 text-thg-mist">That page isn&apos;t in the deck.</p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
        Back to the table
      </Link>
    </main>
  );
}
