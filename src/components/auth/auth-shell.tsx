import { Logo } from "@/components/brand/logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="felt-gradient flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo onDark size="md" />
        </div>
        <div className="border-l-4 border-l-thg-yellow bg-thg-surface p-7 shadow-xl">
          {children}
        </div>
      </div>
    </main>
  );
}
