import { requireUser } from "@/lib/auth-helpers";
import { AppNav } from "@/components/nav/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav isAdmin={user.role === "admin"} name={user.name} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
