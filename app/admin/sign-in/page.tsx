"use client";

import { useActionState } from "react";
import { signInWithEmail } from "./actions";
import { btnPrimary, inputClass, labelClass } from "@/components/admin/ui";
import { site } from "@/lib/site";

export default function AdminSignInPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form action={formAction} className="w-full max-w-sm rounded-[14px] border border-border-subtle bg-surface p-6">
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em]">Sign in</h1>
        <p className="mt-1 text-sm text-dim">{site.name} staff only.</p>

        <label className={`${labelClass} mt-6`} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />

        <label className={`${labelClass} mt-4`} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />

        {state?.error ? <p className="mt-4 text-sm text-accent-hover">{state.error}</p> : null}

        <button type="submit" disabled={pending} className={`${btnPrimary} mt-6 w-full`}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
