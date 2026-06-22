import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pairings", label: "Pairings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/announcements", label: "Announcements" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-thg-slate/15 pb-3">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-md px-3 py-1.5 text-sm font-sans font-semibold text-thg-slate hover:bg-thg-mist-light"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
