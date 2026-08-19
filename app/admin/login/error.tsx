"use client";

/** Same treatment for the login route when a Server Component around it fails. */
export default function AdminLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-medium tracking-[-0.02em]">Sign-in unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          The login page failed to render. If this persists, check Vercel logs and that
          ADMIN_PASSWORD / ADMIN_SESSION_SECRET are set for Preview.
        </p>
        {error.digest && (
          <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-dimmer">
            Digest {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex w-full items-center justify-center rounded-[7px] bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
