"use client";

import { useState } from "react";
import { INVITE_MAILTO } from "@/lib/developer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "./Logo";
import { APP_BYLINE, APP_NAME } from "@/lib/developer";

/** Where to land after signing in: a path on this site, never somewhere else. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isRegister ? { email, password, invite } : { email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? "Something went wrong.");
      setPassword("");
      setShake((n) => n + 1);
      return;
    }
    // A full load, not a router move. While signed out, the router cached the
    // proxy's redirect for every page it prefetched, and a client navigation
    // replays that and lands back here. A real request carries the new cookie.
    window.location.replace(safeNext(params.get("next")));
  }

  const input =
    "w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <div key={shake} className={`card p-6 ${shake ? "shake" : "rise"}`}>
        <div className="mb-4">
          <Logo size={44} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-xs text-muted">
          {APP_NAME} {APP_BYLINE}
        </p>
        <p className="mt-2 text-sm text-ink2">
          {isRegister
            ? "Your statements, cards and profile stay private to this account."
            : params.get("expired") === "1"
              ? "Your session timed out. Sign in to continue."
              : "Sign in to open your statements."}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={input}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? "Password, at least 10 characters" : "Password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={input}
          />
          {isRegister && (
            <div>
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="Invite code"
                className={input}
              />
              <p className="mt-1.5 text-xs text-muted">
                Do not have one?{" "}
                <a href={INVITE_MAILTO} className="text-accent underline underline-offset-2 hover:no-underline">
                  Ask Ankit for a code
                </a>
                .
              </p>
            </div>
          )}
          {error && <p className="text-sm text-bad">{error}</p>}
          <button
            type="submit"
            disabled={busy || !email || !password || (isRegister && !invite)}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <><span className="spinner mr-2" />Working…</> : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-accent underline underline-offset-2">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/register" className="text-accent underline underline-offset-2">
                Create an account
              </Link>
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-muted">Sessions lock automatically after a period of inactivity.</p>
      </div>
    </div>
  );
}
