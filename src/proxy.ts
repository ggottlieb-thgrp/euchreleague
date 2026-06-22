import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight gate: redirect unauthenticated visitors away from app routes.
 * This only checks for the presence of a session cookie (edge-cheap, no DB).
 * Real authorization happens server-side in requireUser()/requireAdmin().
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/announcements",
  "/pairings",
  "/scores",
  "/history",
  "/leaderboard",
  "/availability",
  "/matchups",
  "/players",
  "/settings",
  "/admin",
];

function hasSessionCookie(req: NextRequest): boolean {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token")
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected && !hasSessionCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/announcements/:path*",
    "/pairings/:path*",
    "/scores/:path*",
    "/history/:path*",
    "/leaderboard/:path*",
    "/availability/:path*",
    "/matchups/:path*",
    "/players/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
