import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Require an authenticated session. Redirects to /login if absent.
 * Authoritative server-side gate — use in every protected page/action.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Require an admin. Redirects non-admins to the dashboard. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/** Non-redirecting variant for conditional UI (e.g. showing an admin link). */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
