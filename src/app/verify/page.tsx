"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function VerifyForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = params.get("next") ?? "/dashboard";
  const [code, setCode] = useState("");

  // The email/OTP provider verifies by hitting the GET callback URL with the
  // code + identifier. On success Auth.js creates the session and redirects to
  // `next`; on failure it redirects back to /login?error.
  const callbackUrl =
    `/api/auth/callback/otp?` +
    new URLSearchParams({
      token: code.trim(),
      email,
      callbackUrl: next,
    }).toString();

  return (
    <>
      <h1 className="text-2xl font-extrabold text-thg-slate">Enter your code</h1>
      <p className="mt-1 text-sm text-thg-slate-light">
        We sent a 6-digit code to <span className="font-semibold text-thg-slate">{email}</span>.
        It expires in 10 minutes.
      </p>
      <form action="/api/auth/callback/otp" method="GET" className="mt-6 space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="callbackUrl" value={next} />
        <div className="space-y-1.5">
          <Label htmlFor="token">6-digit code</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            required
            placeholder="123456"
            className="text-center text-2xl tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={code.length !== 6}>
          Verify &amp; sign in
        </Button>
        {/* progressive-enhancement fallback if JS disables the button */}
        <noscript>
          <a className="text-sm underline" href={callbackUrl}>
            Continue
          </a>
        </noscript>
      </form>
      <p className="mt-4 text-center text-sm text-thg-slate-light">
        Wrong email?{" "}
        <Link href="/login" className="font-semibold text-thg-slate underline">
          Start over
        </Link>
      </p>
    </>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
