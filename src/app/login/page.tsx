"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? "That email can't sign in. Use your company email address." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("otp", { email: email.trim(), redirect: false });
      if (res?.error) {
        setError("We couldn't send a code to that address.");
        return;
      }
      router.push(
        `/verify?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(next)}`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-thg-slate">Sign in</h1>
      <p className="mt-1 text-sm text-thg-slate-light">
        Enter your company email and we&apos;ll send you a 6-digit code.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoFocus
            required
            placeholder="you@thgrp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-thg-danger">{error}</p>}
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send my code"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
